/**
 * A Campaign's demographics, on comhairle's versioned questions and forms.
 *
 * Comhairle versions every question and form, and a workflow step asks either a
 * whole form (`demographicform`) or one question (`demographicquestion`). Civic
 * OS hides the versioning: each Campaign owns a form pinned to its initial
 * questions. Subsequent changes use pinned question steps and form overrides,
 * so editing one question cannot repin the others.
 *
 * Campaigns that predate forms carry one `demographicquestion` step per question
 * instead (comhairle's migration made them). Those keep that shape: switching a
 * question on adds another step pinned to the question's current version, and
 * switching one off deletes its step. See ADR 0020.
 */
import type { Api } from '@civicos/shared/api';
import { ageToBucket, type CustomDemographicCategory } from '@civicos/shared/data/demographics';
import type {
	DemographicFormDto,
	PendingQuestion,
	QuestionDto,
	QuestionType,
	QuestionVersionDto,
	ToolConfig
} from '@crownshy/api-client/api';

/** Typed through `Api` so it matches the client the shared package builds. */
export type WorkflowStepDto = Awaited<ReturnType<Api['ListConversationWorkflowSteps']>>[number];

/**
 * The names the pre-versioning questions went by. Comhairle's migration turned
 * each into a system question with a tag of its display name, which is the only
 * thing left to recognise them by, and they matter: Age, Ethnicity, Gender and
 * Political Party carry representation goals under these names, and Postcode
 * feeds the county map.
 */
export type LegacyDemographicKey = 'age' | 'ethnicity' | 'gender' | 'political_party' | 'zipcode';

const LEGACY_KEY_BY_TAG: Record<string, LegacyDemographicKey> = {
	age: 'age',
	ethnicity: 'ethnicity',
	gender: 'gender',
	'political affiliation': 'political_party',
	'political party': 'political_party',
	postcode: 'zipcode',
	zipcode: 'zipcode'
};

const ANSWER_FORMATS: Partial<Record<QuestionType, string>> = {
	number: 'Number',
	date: 'Date',
	text: 'Free text'
};

/** A question as the Setup card and the Participants page read it. */
export interface CampaignQuestion extends CustomDemographicCategory {
	questionType: QuestionType;
	/** Option id to label, for the version the Campaign currently asks. */
	optionLabels: Record<string, string>;
	legacyKey: LegacyDemographicKey | null;
}

/**
 * Why the card is read-only, or null when it is not.
 *
 * `unknown`: the Polis step did not resolve, so a write cannot safely decide
 * whether to update the live configuration. `unreadable`: the form, live
 * questions or question bank could not be read. A write built on a partial
 * picture could drop questions. `no-host` and `no-workflow`: there is no Host
 * to own a form, or no workflow to put its step in.
 */
export type DemographicsLock = 'unknown' | 'unreadable' | 'no-host' | 'no-workflow';

const LOCK_MESSAGES: Record<DemographicsLock, string> = {
	unknown: 'Could not tell whether this Campaign has launched, so its questions are read-only.',
	unreadable:
		"Could not read this Campaign's demographics questions. Its owning Host's members can change them.",
	'no-host': 'This Campaign has no Host, and a Host has to own its demographics questions.',
	'no-workflow': 'This Campaign has no workflow to ask demographics questions in.'
};

/** The note the Setup card shows when it is read-only. */
export function lockMessage(lock: DemographicsLock | null): string | null {
	return lock ? LOCK_MESSAGES[lock] : null;
}

export interface CampaignDemographics {
	lock: DemographicsLock | null;
	/** System questions every Host can ask, minus Postcode, which is collected at join. */
	defaults: CampaignQuestion[];
	/** The Host's own question bank. */
	custom: CampaignQuestion[];
	/** Questions whose answers are zip codes, for the county map. */
	zipQuestionIds: string[];
}

/** Where a Campaign's demographics live. */
export interface DemographicsTarget {
	conversationId: string;
	workflowId: string;
	organizationId: string;
	/** Names the Campaign's form, so it is recognisable in comhairle. */
	title: string;
	pollLaunched: boolean;
}

interface DemographicSteps {
	formStep: { id: string; formId: string; live: boolean } | null;
	/** Question id to the `demographicquestion` step asking it. */
	questionSteps: Record<string, string>;
	nextStepOrder: number;
}

type DemographicConfig =
	{ type: 'demographicform'; formId: string } | { type: 'demographicquestion'; questionId: string };

function readDemographicConfig(config: unknown): DemographicConfig | null {
	if (!config || typeof config !== 'object') return null;
	const bag = config as Record<string, unknown>;
	if (bag.type === 'demographicform' && typeof bag.form_id === 'string') {
		return { type: 'demographicform', formId: bag.form_id };
	}
	if (bag.type === 'demographicquestion' && typeof bag.question_id === 'string') {
		return { type: 'demographicquestion', questionId: bag.question_id };
	}
	return null;
}

/**
 * Prefer the configuration participants see. Migrated question steps can have
 * a live config before launch, so the presence of a config only marks a form
 * step as live here.
 */
export function readDemographicSteps(
	steps: Pick<WorkflowStepDto, 'id' | 'stepOrder' | 'toolConfig' | 'previewToolConfig'>[]
): DemographicSteps {
	let formStep: DemographicSteps['formStep'] = null;
	const questionSteps: Record<string, string> = {};
	for (const step of steps) {
		const config =
			readDemographicConfig(step.toolConfig) ?? readDemographicConfig(step.previewToolConfig);
		if (config?.type === 'demographicform' && !formStep) {
			formStep = {
				id: step.id,
				formId: config.formId,
				live: readDemographicConfig(step.toolConfig)?.type === 'demographicform'
			};
		} else if (config?.type === 'demographicquestion') {
			questionSteps[config.questionId] = step.id;
		}
	}
	const nextStepOrder = steps.reduce((max, step) => Math.max(max, step.stepOrder + 1), 0);
	return { formStep, questionSteps, nextStepOrder };
}

type FormEntry = { question_id: string; required: boolean };
type FormConfig = Extract<ToolConfig, { type: 'demographicform' }>;

/** The preview's enabled form entries, including any per-step overrides. */
function previewFormEntries(form: DemographicFormDto, step: WorkflowStepDto): FormEntry[] {
	const published = form.latest_published;
	if (!published) throw new Error('This Campaign has no published demographics form.');
	const preview = step.previewToolConfig;
	if (preview.type !== 'demographicform' || preview.form_id !== form.id) {
		throw new Error('Could not read the Campaign’s demographics form configuration.');
	}
	if (preview.version.type === 'pinned' && preview.version.version_id !== published.id) {
		throw new Error('Could not read the pinned demographics form version.');
	}
	return [...published.entries]
		.sort((a, b) => a.position - b.position)
		.flatMap((entry) => {
			const override = preview.questions.find((item) => item.question_id === entry.question_id);
			if (override && !override.enabled) return [];
			return [{ question_id: entry.question_id, required: override?.required ?? entry.required }];
		});
}

function legacyKeyFor(question: QuestionDto): LegacyDemographicKey | null {
	if (question.organization_id) return null;
	for (const tag of question.tags) {
		if (tag.organization_id) continue;
		const key = LEGACY_KEY_BY_TAG[tag.name.trim().toLowerCase()];
		if (key) return key;
	}
	return null;
}

function toCampaignQuestion(
	question: QuestionDto,
	enabled: Set<string>,
	liveVersion?: QuestionVersionDto
): CampaignQuestion | null {
	const version = liveVersion ?? question.latest_published;
	if (!version) return null;
	const options = [...version.options].sort((a, b) => a.position - b.position);
	return {
		id: question.id,
		displayName: version.text,
		options: options.map((option) => option.label),
		answerFormat: ANSWER_FORMATS[version.question_type],
		multipleSelection: version.question_type === 'multi_select',
		enabled: enabled.has(question.id),
		questionType: version.question_type,
		optionLabels: Object.fromEntries(options.map((option) => [option.id, option.label])),
		legacyKey: legacyKeyFor(question)
	};
}

/**
 * Sort a question bank into what the Setup card lists. Archived questions only
 * appear while this Campaign still asks them, so they can be switched off.
 */
export function campaignQuestions(
	questions: QuestionDto[],
	organizationId: string | null,
	enabledIds: Iterable<string>,
	liveVersions: ReadonlyMap<string, QuestionVersionDto> = new Map()
) {
	const enabled = new Set(enabledIds);
	const defaults: CampaignQuestion[] = [];
	const custom: CampaignQuestion[] = [];
	const zipQuestionIds: string[] = [];

	for (const question of questions) {
		const row = toCampaignQuestion(question, enabled, liveVersions.get(question.id));
		if (!row) continue;
		if (row.legacyKey === 'zipcode') {
			zipQuestionIds.push(row.id);
			continue;
		}
		if (question.archived_at && !row.enabled) continue;
		if (!question.organization_id) defaults.push(row);
		else if (question.organization_id === organizationId) custom.push(row);
	}

	return { defaults, custom, zipQuestionIds };
}

/**
 * Everything the Setup card needs. Never throws: a failed read leaves an empty,
 * read-only card rather than taking the Campaign's pages down with it.
 */
export async function loadCampaignDemographics(
	api: Api,
	context: {
		organizationId: string | null;
		pollLaunched: boolean | null;
		workflowId: string | null;
		steps: WorkflowStepDto[];
	}
): Promise<CampaignDemographics> {
	const { organizationId, workflowId, steps } = context;
	const read = readDemographicSteps(steps);
	const liveSteps = steps.filter(
		(step) =>
			readDemographicConfig(step.toolConfig) &&
			(context.pollLaunched === true || step.id === read.formStep?.id)
	);

	let unreadable = false;
	const [form, questions, pending] = await Promise.all([
		read.formStep
			? getForm(api, read.formStep.formId, organizationId).catch((e) => {
					console.warn('GetDemographicForm failed', e);
					unreadable = true;
					return null;
				})
			: null,
		api
			.ListDemographicQuestions({ queries: orgQuery(organizationId) })
			.catch((e): QuestionDto[] => {
				console.warn('ListDemographicQuestions failed', e);
				unreadable = true;
				return [];
			}),
		Promise.all(
			liveSteps.map(async (step) => {
				try {
					return [step.id, await pendingQuestions(api, step.id)] as const;
				} catch (e) {
					console.warn('GetPendingDemographicQuestions failed', e);
					unreadable = true;
					const empty: PendingQuestion[] = [];
					return [step.id, empty] as const;
				}
			})
		)
	]);

	const pendingByStep = new Map(pending);
	const liveVersions = new Map(
		pending.flatMap(([, items]) => items.map(({ version }) => [version.question_id, version]))
	);
	let formEntries: FormEntry[] = [];
	if (read.formStep?.live) {
		formEntries = pendingEntries(pendingByStep.get(read.formStep.id) ?? []);
	} else if (read.formStep && form) {
		try {
			const step = steps.find((item) => item.id === read.formStep?.id);
			if (!step) throw new Error('The demographics step is missing.');
			formEntries = previewFormEntries(form, step);
		} catch (e) {
			console.warn('Reading the demographics form failed', e);
			unreadable = true;
		}
	}
	const enabled = [
		...formEntries.map((entry) => entry.question_id),
		...Object.keys(read.questionSteps)
	];
	const sorted = campaignQuestions(questions, organizationId, enabled, liveVersions);

	let lock: DemographicsLock | null = null;
	if (!workflowId) lock = 'no-workflow';
	else if (!organizationId) lock = 'no-host';
	else if (context.pollLaunched === null) lock = 'unknown';
	else if (unreadable) lock = 'unreadable';

	return {
		lock,
		...sorted
	};
}

/**
 * Turn one stored answer into the labels it counts under: one for most
 * questions, several for a multi-select, none for a skipped question.
 *
 * Select answers store option ids, and every question version mints new ones.
 * The API currently exposes only the active version's labels. An older id is
 * reported separately rather than being mistaken for an answer of "Other".
 */
export const UNKNOWN_OPTION_LABEL = 'Unknown option';

export function answerLabels(
	value: unknown,
	question: Pick<CampaignQuestion, 'optionLabels' | 'legacyKey'>
): string[] {
	if (value === null || value === undefined) return [];
	if (typeof value === 'number') {
		return [question.legacyKey === 'age' ? ageToBucket(value) : String(value)];
	}
	if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
	if (typeof value !== 'object') return [];

	const bag = value as Record<string, unknown>;
	if (typeof bag.postcode === 'string') return bag.postcode.trim() ? [bag.postcode.trim()] : [];

	const labels: string[] = [];
	if (Array.isArray(bag.option_ids)) {
		for (const id of bag.option_ids) {
			labels.push((typeof id === 'string' && question.optionLabels[id]) || UNKNOWN_OPTION_LABEL);
		}
	}
	if (typeof bag.other_text === 'string' && bag.other_text.trim()) labels.push('Other');
	if (bag.prefer_not_to_say === true) labels.push('Prefer not to say');
	return [...new Set(labels)];
}

// ---------------------------------------------------------------------------
// Writes

/**
 * One write at a time. Every write reads the form or steps it is about to
 * change, but two toggles clicked together would still both start a draft of
 * the same form, and comhairle refuses the second.
 */
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(write: () => Promise<T>): Promise<T> {
	const next = queue.then(write, write);
	queue = next.catch(() => undefined);
	return next;
}

function orgQuery(organizationId: string | null | undefined) {
	return organizationId ? { organization_id: organizationId } : {};
}

function stepParams(target: Pick<DemographicsTarget, 'conversationId' | 'workflowId'>) {
	return { conversation_id: target.conversationId, workflow_id: target.workflowId };
}

function listSteps(api: Api, target: Pick<DemographicsTarget, 'conversationId' | 'workflowId'>) {
	return api.ListConversationWorkflowSteps({ params: stepParams(target) });
}

function getForm(api: Api, formId: string, organizationId: string | null) {
	return api.GetDemographicForm({
		params: { form_id: formId },
		queries: orgQuery(organizationId)
	});
}

function pendingQuestions(api: Api, stepId: string) {
	return api.GetPendingDemographicQuestions({ params: { step_id: stepId } });
}

function pendingEntries(pending: PendingQuestion[]): FormEntry[] {
	return pending.map(({ version, required }) => ({ question_id: version.question_id, required }));
}

function pinnedFormConfig(form: DemographicFormDto, step: WorkflowStepDto): FormConfig {
	const config =
		step.toolConfig?.type === 'demographicform' ? step.toolConfig : step.previewToolConfig;
	if (config.type !== 'demographicform' || config.form_id !== form.id) {
		throw new Error('Could not read the Campaign’s demographics form configuration.');
	}
	if (config.version.type === 'pinned') return config;
	const versionId = form.latest_published?.id;
	if (!versionId) throw new Error('The demographics form has no published version.');
	return { ...config, version: { type: 'pinned', version_id: versionId } };
}

async function ensureFormPinned(
	api: Api,
	target: DemographicsTarget,
	form: DemographicFormDto,
	step: WorkflowStepDto
) {
	const preview = step.previewToolConfig;
	const live = step.toolConfig?.type === 'demographicform' ? step.toolConfig : null;
	if (preview.type !== 'demographicform' || (target.pollLaunched && !live)) {
		throw new Error('This Campaign’s demographics form cannot be changed safely.');
	}
	const config = pinnedFormConfig(form, step);
	if (
		config.version.type === 'pinned' &&
		preview.form_id === config.form_id &&
		preview.version.type === 'pinned' &&
		preview.version.version_id === config.version.version_id &&
		(!live || live.version.type === 'pinned')
	) {
		return;
	}
	await api.UpdateConversationWorkflowStep(
		{ preview_tool_config: config, ...(live ? { tool_config: config } : {}) },
		{ params: { ...stepParams(target), workflow_step_id: step.id } }
	);
}

async function disableFormQuestion(
	api: Api,
	target: DemographicsTarget,
	form: DemographicFormDto,
	step: WorkflowStepDto,
	entry: FormEntry
) {
	const live = step.toolConfig?.type === 'demographicform';
	if (step.previewToolConfig.type !== 'demographicform') {
		throw new Error('Could not read the Campaign’s demographics preview configuration.');
	}
	if (target.pollLaunched && !live) {
		throw new Error('This Campaign’s demographics form is not live and cannot be changed safely.');
	}
	const config = pinnedFormConfig(form, step);
	const updated: FormConfig = {
		...config,
		questions: [
			...config.questions.filter((item) => item.question_id !== entry.question_id),
			{ ...entry, enabled: false }
		]
	};
	await api.UpdateConversationWorkflowStep(
		{ preview_tool_config: updated, ...(live ? { tool_config: updated } : {}) },
		{ params: { ...stepParams(target), workflow_step_id: step.id } }
	);
}

async function restoreFormStep(api: Api, target: DemographicsTarget, step: WorkflowStepDto) {
	if (step.previewToolConfig.type !== 'demographicform') {
		throw new Error('Could not restore the Campaign’s demographics preview configuration.');
	}
	await api.UpdateConversationWorkflowStep(
		{
			preview_tool_config: step.previewToolConfig,
			...(step.toolConfig?.type === 'demographicform' ? { tool_config: step.toolConfig } : {})
		},
		{ params: { ...stepParams(target), workflow_step_id: step.id } }
	);
}

function disabledFormQuestionRequired(
	form: DemographicFormDto,
	step: WorkflowStepDto,
	questionId: string
): boolean {
	const config = pinnedFormConfig(form, step);
	return (
		config.questions.find((item) => item.question_id === questionId)?.required ??
		form.latest_published?.entries.find((entry) => entry.question_id === questionId)?.required ??
		false
	);
}

/**
 * Create and publish a Campaign's form, and the workflow step that asks it.
 * The form is archived again if the step cannot be made, so a failure does not
 * leave an orphan in the Host's form list.
 */
export async function createCampaignForm(
	api: Api,
	target: DemographicsTarget,
	questionIds: string[],
	stepOrder: number
) {
	const queries = orgQuery(target.organizationId);
	const form = await api.CreateDemographicForm(
		{
			name: target.title,
			entries: questionIds.map((question_id, position) => ({
				question_id,
				position,
				required: false
			}))
		},
		{ queries }
	);
	let step: WorkflowStepDto | null = null;
	try {
		const published = await api.PublishDemographicForm(undefined, {
			params: { form_id: form.id },
			queries
		});
		const versionId = published.latest_published?.id;
		if (!versionId) throw new Error('The published demographics form has no version.');
		step = await api.CreateConversationWorkflowStep(
			{
				name: 'Demographics',
				description: 'Questions about the participant.',
				step_order: stepOrder,
				required: false,
				is_offline: false,
				activation_rule: 'manual',
				tool_setup: {
					type: 'demographicform',
					form_id: form.id,
					version: { type: 'pinned', version_id: versionId },
					questions: []
				}
			},
			{ params: stepParams(target) }
		);
		if (target.pollLaunched && !step.toolConfig) {
			await api.UpdateConversationWorkflowStep(
				{
					tool_config: {
						type: 'demographicform',
						form_id: form.id,
						version: { type: 'pinned', version_id: versionId },
						questions: []
					}
				},
				{ params: { ...stepParams(target), workflow_step_id: step.id } }
			);
		}
		return step;
	} catch (e) {
		let canArchive = true;
		if (step) {
			try {
				await api.DeleteConversationWorkflowStep(undefined, {
					params: { ...stepParams(target), workflow_step_id: step.id }
				});
			} catch (cleanupError) {
				console.warn('Removing the unused demographics step failed', cleanupError);
				canArchive = false;
			}
		}
		if (canArchive) {
			await api
				.ArchiveDemographicForm(undefined, { params: { form_id: form.id }, queries })
				.catch((archiveError) => console.warn('Archiving the unused form failed', archiveError));
		}
		throw e;
	}
}

/**
 * Give a new Campaign its demographics form, asking every system default
 * except Postcode (the zip is collected at join). Nothing is created when
 * there are no published defaults to ask.
 */
export async function createDefaultCampaignForm(
	api: Api,
	target: DemographicsTarget,
	stepOrder: number
) {
	const questions = await api.ListDemographicQuestions({
		queries: orgQuery(target.organizationId)
	});
	const { defaults } = campaignQuestions(questions, target.organizationId, []);
	const ids = defaults.map((question) => question.id);
	if (ids.length === 0) return null;
	return createCampaignForm(api, target, ids, stepOrder);
}

async function latestPublishedVersion(api: Api, questionId: string, organizationId: string) {
	const question = await api.GetDemographicQuestion({
		params: { question_id: questionId },
		queries: orgQuery(organizationId)
	});
	const version = question.latest_published;
	if (!version) throw new Error('That question has not been published yet.');
	return { question, version };
}

class QuestionStepCleanupError extends Error {
	constructor(cause: unknown) {
		super(
			'The new question step could not be removed after a failed update. Refresh the Campaign and check its questions.',
			{ cause }
		);
	}
}

async function createQuestionStep(
	api: Api,
	target: DemographicsTarget,
	questionId: string,
	version: Pick<QuestionVersionDto, 'id' | 'text'>,
	stepOrder: number,
	required: boolean
) {
	const config = {
		type: 'demographicquestion' as const,
		question_id: questionId,
		version: { type: 'pinned' as const, version_id: version.id }
	};
	const step = await api.CreateConversationWorkflowStep(
		{
			name: version.text,
			description: '',
			step_order: stepOrder,
			required,
			is_offline: false,
			activation_rule: 'manual',
			tool_setup: config
		},
		{ params: stepParams(target) }
	);
	if (target.pollLaunched && !step.toolConfig) {
		try {
			await api.UpdateConversationWorkflowStep(
				{ tool_config: config },
				{ params: { ...stepParams(target), workflow_step_id: step.id } }
			);
		} catch (e) {
			try {
				await api.DeleteConversationWorkflowStep(undefined, {
					params: { ...stepParams(target), workflow_step_id: step.id }
				});
			} catch (cleanupError) {
				console.warn('Removing the unused question step failed', cleanupError);
				throw new QuestionStepCleanupError(e);
			}
			throw e;
		}
	}
	return step;
}

async function writeQuestionEnabled(
	api: Api,
	target: DemographicsTarget,
	questionId: string,
	enabled: boolean
) {
	const steps = await listSteps(api, target);
	const { formStep, questionSteps, nextStepOrder } = readDemographicSteps(steps);
	const step = steps.find((item) => item.id === formStep?.id);
	const form = formStep ? await getForm(api, formStep.formId, target.organizationId) : null;
	const formPending = formStep?.live ? await pendingQuestions(api, formStep.id) : [];
	let entries: FormEntry[] = [];
	if (formStep && form && step) {
		entries = formStep.live ? pendingEntries(formPending) : previewFormEntries(form, step);
	}
	const formEntry = entries.find((entry) => entry.question_id === questionId);

	if (!enabled) {
		const stepId = questionSteps[questionId];
		if (!stepId && !formEntry) return;
		if (form && step && formEntry) {
			await disableFormQuestion(api, target, form, step, formEntry);
		}
		if (stepId) {
			try {
				await api.DeleteConversationWorkflowStep(undefined, {
					params: { ...stepParams(target), workflow_step_id: stepId }
				});
			} catch (e) {
				if (formEntry && step) {
					try {
						await restoreFormStep(api, target, step);
					} catch (restoreError) {
						console.warn('Restoring the demographics form failed', restoreError);
						throw new Error(
							'The question could not be removed and its form could not be restored. Refresh the Campaign and check its questions.',
							{ cause: e }
						);
					}
				}
				throw e;
			}
		}
		return;
	}

	if (questionSteps[questionId] || formEntry) return;

	if (form && step) {
		const { version } = await latestPublishedVersion(api, questionId, target.organizationId);
		await ensureFormPinned(api, target, form, step);
		await createQuestionStep(
			api,
			target,
			questionId,
			version,
			nextStepOrder,
			disabledFormQuestionRequired(form, step, questionId)
		);
		return;
	}

	// Keep migrated Campaigns with remaining question steps in step mode.
	if (!formStep && Object.keys(questionSteps).length > 0) {
		const { version } = await latestPublishedVersion(api, questionId, target.organizationId);
		await createQuestionStep(api, target, questionId, version, nextStepOrder, false);
		return;
	}

	await createCampaignForm(api, target, [questionId], nextStepOrder);
}

/** Switch a question on or off for this Campaign. The question bank is never touched. */
export function setQuestionEnabled(
	api: Api,
	target: DemographicsTarget,
	questionId: string,
	enabled: boolean
) {
	return serialize(() => writeQuestionEnabled(api, target, questionId, enabled));
}

/** A tag to file a Host's question under. Comhairle will not publish an untagged one. */
async function tagFor(api: Api, name: string, organizationId: string) {
	const queries = orgQuery(organizationId);
	const wanted = name.trim().toLowerCase();
	const tags = await api.ListDemographicTags({ queries });
	const existing = tags.find((tag) => tag.name.trim().toLowerCase() === wanted);
	return existing ?? (await api.CreateDemographicTag({ name: name.trim() }, { queries }));
}

/** Add a single-choice question to the Host's bank, then switch it on for this Campaign. */
export function createCustomQuestion(
	api: Api,
	target: DemographicsTarget,
	category: Pick<CustomDemographicCategory, 'displayName' | 'options'>
) {
	return serialize(async () => {
		const queries = orgQuery(target.organizationId);
		const tag = await tagFor(api, category.displayName, target.organizationId);
		const question = await api.CreateDemographicQuestion(
			{
				text: category.displayName,
				question_type: 'single_select',
				options: category.options,
				tag_ids: [tag.id]
			},
			{ queries }
		);
		await api.PublishDemographicQuestion(undefined, {
			params: { question_id: question.id },
			queries
		});
		try {
			await writeQuestionEnabled(api, target, question.id, true);
		} catch (e) {
			throw new Error(
				'The question was added to the Host bank, but not to this Campaign. Refresh the page and enable it from the list.',
				{ cause: e }
			);
		}
	});
}

/**
 * Publish a new version of a Host's question. Where this Campaign asks it, the
 * Campaign moves to the new version too; other questions and Campaigns keep
 * their pinned versions.
 */
export function editCustomQuestion(
	api: Api,
	target: DemographicsTarget,
	category: Pick<CustomDemographicCategory, 'id' | 'displayName' | 'options'>
) {
	return serialize(async () => {
		const queries = orgQuery(target.organizationId);
		const config = { params: { question_id: category.id }, queries };
		const { question, version: latestVersion } = await latestPublishedVersion(
			api,
			category.id,
			target.organizationId
		);
		const steps = await listSteps(api, target);
		const { formStep, questionSteps, nextStepOrder } = readDemographicSteps(steps);
		const formWorkflowStep = steps.find((step) => step.id === formStep?.id);
		const form = formStep ? await getForm(api, formStep.formId, target.organizationId) : null;
		const formPending = formStep?.live ? await pendingQuestions(api, formStep.id) : [];
		let entries: FormEntry[] = [];
		if (form && formWorkflowStep) {
			entries = formStep?.live
				? pendingEntries(formPending)
				: previewFormEntries(form, formWorkflowStep);
		}
		const questionStep = steps.find((step) => step.id === questionSteps[category.id]);
		const questionPending = questionStep?.toolConfig
			? await pendingQuestions(api, questionStep.id)
			: [];
		const version =
			[...formPending, ...questionPending].find((item) => item.version.question_id === category.id)
				?.version ?? latestVersion;
		const formEntry = entries.find((entry) => entry.question_id === category.id);
		if (!question.draft) await api.StartDemographicQuestionDraft(undefined, config);
		await api.UpdateDemographicQuestionDraft(
			{
				text: category.displayName,
				question_type: version.question_type,
				options: category.options,
				tag_ids: question.tags.map((tag) => tag.id),
				allow_other: version.allow_other,
				prefer_not_to_say: version.prefer_not_to_say,
				special_category: version.special_category,
				consent_text: version.consent_text ?? null,
				max_selections: version.max_selections ?? null,
				date_precision: version.date_precision ?? null
			},
			config
		);
		const published = await api.PublishDemographicQuestion(undefined, config);
		const versionId = published.latest_published?.id;
		if (!versionId) throw new Error('The published demographics question has no version.');
		let formDisabled = false;
		try {
			if (form && formWorkflowStep && formEntry) {
				await disableFormQuestion(api, target, form, formWorkflowStep, formEntry);
				formDisabled = true;
			}
			if (questionStep) {
				const toolConfig = {
					type: 'demographicquestion' as const,
					question_id: category.id,
					version: { type: 'pinned' as const, version_id: versionId }
				};
				await api.UpdateConversationWorkflowStep(
					{
						preview_tool_config: toolConfig,
						...(questionStep.toolConfig || target.pollLaunched ? { tool_config: toolConfig } : {})
					},
					{ params: { ...stepParams(target), workflow_step_id: questionStep.id } }
				);
			} else if (formEntry) {
				await createQuestionStep(
					api,
					target,
					category.id,
					{ id: versionId, text: category.displayName },
					nextStepOrder,
					formEntry.required
				);
			}
		} catch (e) {
			if (formDisabled && formWorkflowStep && !(e instanceof QuestionStepCleanupError)) {
				try {
					await restoreFormStep(api, target, formWorkflowStep);
				} catch (restoreError) {
					console.warn('Restoring the demographics form failed', restoreError);
					throw new Error(
						'The question was published, but its Campaign form could not be restored. Refresh the Campaign and check its questions.',
						{ cause: e }
					);
				}
			}
			if (e instanceof QuestionStepCleanupError) throw e;
			throw new Error(
				'The question was published, but the Campaign could not be updated. Retry the change.',
				{ cause: e }
			);
		}
	});
}
