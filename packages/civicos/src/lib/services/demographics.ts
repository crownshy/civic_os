import type { Api } from '@civicos/shared/api';
import { httpStatusOf } from '$lib/utils/http';
import type {
	MyDemographicAnswer,
	PendingQuestion,
	QuestionVersionDto
} from '@crownshy/api-client/api';

export interface AnswerDraft {
	value: string;
	optionIds: string[];
	other: boolean;
	otherText: string;
	preferNotToSay: boolean;
	consent: boolean;
}

export interface AboutYouQuestion {
	version: QuestionVersionDto;
	required: boolean;
	initial: AnswerDraft;
}

export type AnswerDrafts = Record<string, AnswerDraft>;

export interface SaveAnswersResult {
	success: boolean;
	saved: string[];
	conflict?: string;
}

const emptyAnswer = (): AnswerDraft => ({
	value: '',
	optionIds: [],
	other: false,
	otherText: '',
	preferNotToSay: false,
	consent: false
});

function prefill(version: QuestionVersionDto, previous?: MyDemographicAnswer): AnswerDraft {
	const draft = emptyAnswer();
	if (!previous || previous.version.question_type !== version.question_type) return draft;

	const value = previous.answer.value;
	if (version.question_type === 'number' && typeof value === 'number' && Number.isFinite(value)) {
		draft.value = String(value);
	} else if (version.question_type === 'text' && typeof value === 'string') {
		draft.value = value;
	} else if (version.question_type === 'date' && typeof value === 'string') {
		draft.value = value.replaceAll('/', '-');
	} else if (
		(version.question_type === 'single_select' || version.question_type === 'multi_select') &&
		value &&
		typeof value === 'object'
	) {
		const selection = value as {
			option_ids?: unknown;
			other_text?: unknown;
			prefer_not_to_say?: unknown;
		};
		if (selection.prefer_not_to_say === true) {
			draft.preferNotToSay = version.prefer_not_to_say;
			return draft;
		}
		const ids = Array.isArray(selection.option_ids) ? selection.option_ids : [];
		const labels = ids.map(
			(id: unknown) => previous.version.options.find((option) => option.id === id)?.label
		);
		const options = labels.map((label) =>
			version.options.filter((option) => option.label === label)
		);
		const matchedIds = options.flatMap((matches) => matches.map((option) => option.id));
		if (
			labels.some(
				(label) => previous.version.options.filter((option) => option.label === label).length !== 1
			) ||
			options.some((matches) => matches.length !== 1) ||
			new Set(matchedIds).size !== matchedIds.length ||
			(version.question_type === 'single_select' && ids.length > 1) ||
			(version.question_type === 'single_select' &&
				ids.length > 0 &&
				typeof selection.other_text === 'string') ||
			(version.max_selections != null && ids.length > version.max_selections) ||
			(typeof selection.other_text === 'string' && !version.allow_other)
		)
			return draft;
		draft.optionIds = matchedIds;
		if (version.allow_other && typeof selection.other_text === 'string') {
			draft.other = true;
			draft.otherText = selection.other_text;
		}
	}
	return draft;
}

/**
 * Ask each new version once per Campaign. An earlier answer is only a
 * suggestion, and a select answer can be reused only when its labels still
 * identify options in the new version.
 */
export function questionsForCampaign(
	pending: PendingQuestion[],
	answers: MyDemographicAnswer[],
	conversationId: string
): AboutYouQuestion[] {
	const seen = new Set<string>();
	const questions: AboutYouQuestion[] = [];
	for (const item of pending) {
		const { version } = item;
		if (seen.has(version.question_id)) {
			throw new Error('The Campaign asks the same demographic question in more than one step.');
		}
		seen.add(version.question_id);
		if (
			item.skipped ||
			answers.some(
				({ answer }) =>
					answer.question_version_id === version.id && answer.conversation_id === conversationId
			)
		) {
			continue;
		}
		const previous = answers.find(
			({ answer, consent, version: earlier }) =>
				answer.question_id === version.question_id &&
				(!earlier.special_category || consent === 'granted')
		);
		questions.push({ version, required: item.required, initial: prefill(version, previous) });
	}
	return questions;
}

/** A previously skipped optional question must reappear if it becomes required. */
export function unacknowledgedQuestions(
	questions: AboutYouQuestion[],
	acknowledgedVersions: readonly string[]
): AboutYouQuestion[] {
	return questions.filter(
		(question) => question.required || !acknowledgedVersions.includes(question.version.id)
	);
}

type ReadApi = Pick<
	Api,
	| 'ListConversationWorkflows'
	| 'ListConversationWorkflowSteps'
	| 'GetPendingDemographicQuestions'
	| 'ListMyDemographicAnswers'
>;

/** Read the active form and question steps using the participant's session. */
export async function loadCampaignQuestions(api: ReadApi, conversationId: string) {
	const workflows = await api.ListConversationWorkflows({
		params: { conversation_id: conversationId }
	});
	const workflow = workflows.find((item) => item.isActive) ?? workflows[0];
	if (!workflow) throw new Error('This Campaign has no workflow.');

	const steps = await api.ListConversationWorkflowSteps({
		params: { conversation_id: conversationId, workflow_id: workflow.id }
	});
	const demographicSteps = [...steps]
		.sort((a, b) => a.stepOrder - b.stepOrder)
		.filter(
			(step) =>
				step.toolConfig?.type === 'demographicform' ||
				step.toolConfig?.type === 'demographicquestion'
		);
	if (!demographicSteps.length) return [];
	const [pending, answers] = await Promise.all([
		Promise.all(
			demographicSteps.map((step) =>
				api.GetPendingDemographicQuestions({ params: { step_id: step.id } })
			)
		),
		api.ListMyDemographicAnswers()
	]);
	return questionsForCampaign(pending.flat(), answers, conversationId);
}

type PreviewApi = Pick<
	Api,
	| 'ListConversationWorkflows'
	| 'ListConversationWorkflowSteps'
	| 'GetDemographicForm'
	| 'GetDemographicQuestion'
>;

/** Resolve draft steps with the Host's session without submitting answers. */
export async function loadPreviewQuestions(
	api: PreviewApi,
	conversationId: string,
	organizationId: string | null
) {
	const workflows = await api.ListConversationWorkflows({
		params: { conversation_id: conversationId }
	});
	const workflow = workflows.find((item) => item.isActive) ?? workflows[0];
	if (!workflow) throw new Error('This Campaign has no workflow.');
	const steps = await api.ListConversationWorkflowSteps({
		params: { conversation_id: conversationId, workflow_id: workflow.id }
	});
	const queries = organizationId ? { organization_id: organizationId } : {};
	const result: AboutYouQuestion[] = [];

	async function addQuestion(questionId: string, versionId: string | undefined, required: boolean) {
		if (result.some((item) => item.version.question_id === questionId)) {
			throw new Error('The Campaign asks the same demographic question in more than one step.');
		}
		const question = await api.GetDemographicQuestion({
			params: { question_id: questionId },
			queries
		});
		const version = question.latest_published;
		if (!version || (versionId && version.id !== versionId)) {
			throw new Error('A pinned question version is unavailable in this preview.');
		}
		result.push({ version, required, initial: emptyAnswer() });
	}

	for (const step of [...steps].sort((a, b) => a.stepOrder - b.stepOrder)) {
		const config = step.previewToolConfig;
		if (config.type === 'demographicquestion') {
			await addQuestion(
				config.question_id,
				config.version.type === 'pinned' ? config.version.version_id : undefined,
				step.required
			);
		} else if (config.type === 'demographicform') {
			const form = await api.GetDemographicForm({ params: { form_id: config.form_id }, queries });
			const published = form.latest_published;
			if (
				!published ||
				(config.version.type === 'pinned' && config.version.version_id !== published.id)
			) {
				throw new Error('The pinned form version is unavailable in this preview.');
			}
			for (const entry of [...published.entries].sort((a, b) => a.position - b.position)) {
				const override = config.questions.find((item) => item.question_id === entry.question_id);
				if (override && !override.enabled) continue;
				if (!entry.question_version_id) {
					throw new Error('A pinned question version is unavailable in this preview.');
				}
				await addQuestion(
					entry.question_id,
					entry.question_version_id,
					override?.required ?? entry.required
				);
			}
		}
	}
	return result;
}

/** Convert validated form data to the answer shape required by the question version. */
export function responseValue(question: AboutYouQuestion, draft: AnswerDraft): unknown | undefined {
	const { version } = question;
	if (version.question_type === 'single_select' || version.question_type === 'multi_select') {
		if (draft.preferNotToSay) return { option_ids: [], prefer_not_to_say: true };
		const other = draft.other ? draft.otherText.trim() : '';
		if (!draft.optionIds.length && !other) return undefined;
		return { option_ids: draft.optionIds, ...(other ? { other_text: other } : {}) };
	}
	const value = draft.value.trim();
	if (!value) return undefined;
	if (version.question_type === 'number') return Number(value);
	if (version.question_type === 'date') return value.replaceAll('-', '/');
	return value;
}

type WriteApi = Pick<Api, 'UpsertUserProfile' | 'SetDemographicConsent' | 'PutDemographicResponse'>;

/**
 * A successful write is never repeated with a different value. Returning the
 * saved ids lets the screen lock those answers if a later write fails.
 */
export async function saveCampaignAnswers(
	api: WriteApi,
	conversationId: string,
	questions: AboutYouQuestion[],
	drafts: AnswerDrafts,
	alreadySaved: readonly string[],
	preview: boolean
): Promise<SaveAnswersResult> {
	if (preview) return { success: true, saved: [] };
	const saved: string[] = [];
	try {
		const answers = questions.flatMap((question) => {
			if (alreadySaved.includes(question.version.id)) return [];
			const draft = drafts[question.version.id];
			const value = draft ? responseValue(question, draft) : undefined;
			return value === undefined ? [] : [{ question, value }];
		});
		if (answers.length) await api.UpsertUserProfile({ consented: true });
		for (const { question, value } of answers) {
			const params = { version_id: question.version.id };
			if (question.version.special_category) {
				await api.SetDemographicConsent({ granted: true }, { params });
			}
			try {
				await api.PutDemographicResponse({ conversation_id: conversationId, value }, { params });
			} catch (error) {
				if (httpStatusOf(error) !== 409) throw error;
				console.warn('[About You] An answer was already submitted for this Campaign and version.');
				saved.push(question.version.id);
				return { success: false, saved, conflict: question.version.id };
			}
			saved.push(question.version.id);
		}
		return { success: true, saved };
	} catch (error) {
		console.error('[About You] Could not save the answers. HTTP status:', httpStatusOf(error));
		return { success: false, saved };
	}
}
