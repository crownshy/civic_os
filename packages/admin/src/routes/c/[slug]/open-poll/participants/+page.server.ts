import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { describeApiFailure } from '$lib/api/describe-failure';
import {
	answerLabels,
	loadCampaignDemographics,
	type CampaignQuestion,
	type LegacyDemographicKey
} from '$lib/api/demographics';
import type { RecruitmentTargetDto } from '@crownshy/api-client/api';
import {
	emptyGoals,
	TOTAL_PARTICIPANTS_BUCKET,
	type GoalMetric,
	type RegionGoals
} from '$lib/config/representation-goals';
import {
	DEMOGRAPHIC_CATEGORIES,
	readParticipationReport,
	type DemographicAnswerCount,
	type ParticipationReport
} from '@civicos/shared/data/demographics';
import { rollUpByCounty } from '@civicos/shared/data/zipcodes';
import { statesForZipCounts } from '@civicos/shared/data/zip-states';

const METRIC_NAMES: GoalMetric[] = [
	'totalParticipants',
	'ethnicity',
	'politicalParty',
	'ageRanges',
	'gender',
	'county'
];

/**
 * The recruitment-target metric a built-in question's goals are stored under.
 * These predate per-question goals, so they keep their old names; every other
 * question stores goals under its id.
 */
const GOAL_METRIC_BY_KEY: Partial<
	Record<LegacyDemographicKey, Exclude<GoalMetric, 'totalParticipants' | 'county'>>
> = {
	age: 'ageRanges',
	ethnicity: 'ethnicity',
	gender: 'gender',
	political_party: 'politicalParty'
};

const NOT_PROVIDED = 'Not Provided';

export interface QuestionRow {
	label: string;
	count: number;
	goal?: number;
}

/** One table on the page: a question switched on for this Campaign. */
export interface QuestionResult {
	id: string;
	displayName: string;
	/** The recruitment-target metric its goals are stored under. */
	goalMetric: string;
	/** The question's options, which are what goals can be set against. */
	buckets: string[];
	rows: QuestionRow[];
	hasUnknownOptions: boolean;
}

/** Answer counts per label. A skipped answer counts as Not Provided. */
function countByLabel(
	answers: DemographicAnswerCount[],
	question: Pick<CampaignQuestion, 'optionLabels' | 'legacyKey'>
): Map<string, number> {
	const byLabel = new Map<string, number>();
	for (const answer of answers) {
		const labels = answerLabels(answer.value, question);
		for (const label of labels.length ? labels : [NOT_PROVIDED]) {
			byLabel.set(label, (byLabel.get(label) ?? 0) + answer.count);
		}
	}
	return byLabel;
}

/**
 * A row per option, in the question's order, then any answer the options do
 * not cover (skipped, free text, or an option since renamed). An option nobody
 * picked still gets a row so a goal set on it has somewhere to show.
 */
function questionRows(
	options: string[],
	byLabel: Map<string, number>,
	goalMap: Record<string, number>
): QuestionRow[] {
	const labels = [...new Set([...options, ...byLabel.keys()])];
	return labels.map((label) => ({ label, count: byLabel.get(label) ?? 0, goal: goalMap[label] }));
}

/**
 * The buckets a question's goals are set against: its options, or for a
 * pre-versioning question that comhairle migrated to a number or free text,
 * the buckets its goals have always used. Comhairle reports raw ages, which
 * `answerLabels` buckets to match.
 */
function bucketsFor(question: CampaignQuestion): string[] {
	if (question.options.length || !question.legacyKey) return question.options;
	const key = question.legacyKey === 'political_party' ? 'politicalParty' : question.legacyKey;
	return DEMOGRAPHIC_CATEGORIES.find((category) => category.key === key)?.options ?? [];
}

function questionResult(
	question: CampaignQuestion,
	report: ParticipationReport,
	goals: RegionGoals
): QuestionResult {
	const builtInMetric = question.legacyKey ? GOAL_METRIC_BY_KEY[question.legacyKey] : undefined;
	const goalMap = builtInMetric ? goals[builtInMetric] : (goals.custom[question.id] ?? {});
	const buckets = bucketsFor(question);
	const answers = report.questions[question.id]?.answers ?? [];
	const hasUnknownOptions = answers.some(({ value }) => {
		if (!value || typeof value !== 'object') return false;
		const ids = (value as { option_ids?: unknown }).option_ids;
		return (
			Array.isArray(ids) &&
			ids.some((id) => typeof id !== 'string' || !Object.hasOwn(question.optionLabels, id))
		);
	});
	return {
		id: question.id,
		displayName: question.displayName,
		goalMetric: builtInMetric ?? question.id,
		buckets,
		rows: questionRows(buckets, countByLabel(answers, question), goalMap),
		hasUnknownOptions
	};
}

/** Zip code to participant count, from the answers to every postcode question. */
function zipcodeCounts(report: ParticipationReport, zipQuestionIds: string[]) {
	const counts: Record<string, number> = {};
	for (const id of zipQuestionIds) {
		for (const answer of report.questions[id]?.answers ?? []) {
			for (const zip of answerLabels(answer.value, { optionLabels: {}, legacyKey: 'zipcode' })) {
				counts[zip] = (counts[zip] ?? 0) + answer.count;
			}
		}
	}
	return counts;
}

/** HTTP status of a failed api-client call, absent when it never reached the server. */
function statusOf(e: unknown): number | undefined {
	return (e as { response?: { status?: number } })?.response?.status;
}

function targetsToGoals(targets: RecruitmentTargetDto[]): RegionGoals {
	const goals = emptyGoals();
	for (const t of targets) {
		if (t.metric === 'totalParticipants') {
			goals.totalParticipants = t.targetCount;
			continue;
		}
		if ((METRIC_NAMES as string[]).includes(t.metric) && t.metric !== 'totalParticipants') {
			const key = t.metric as Exclude<GoalMetric, 'totalParticipants'>;
			goals[key][t.bucket] = t.targetCount;
			continue;
		}
		goals.custom[t.metric] ??= {};
		goals.custom[t.metric][t.bucket] = t.targetCount;
	}
	return goals;
}

export const load: PageServerLoad = async ({ parent, locals, depends }) => {
	depends('open-poll:demographics');
	depends('open-poll:goals');

	const { campaign, campaignDemographics: setup } = await parent();
	const api = locals.api;
	const conversationId = campaign.id;

	let demographics: ParticipationReport | null = null;
	let goals: RegionGoals = emptyGoals();
	let workflowId: string | null = null;
	let error: string | null = null;

	// Zip counts roll up into counties, unscoped: the counties are whichever ones
	// participants actually came from. Places are still being worked out (#404,
	// #405), so scoping waits for something that can express it rather than for
	// a second list a Host has to keep in step with their Place.
	let countyCounts: Record<string, number> = {};
	// USPS state codes the choropleth needs, derived from where participants
	// actually live. Empty means no map to draw.
	let mapStates: string[] = [];
	let questions: QuestionResult[] = [];

	try {
		const workflows = await api.ListConversationWorkflows({
			params: { conversation_id: conversationId }
		});
		workflowId = workflows.find((workflow) => workflow.isActive)?.id ?? workflows[0]?.id ?? null;

		if (!workflowId) {
			error = 'this Campaign has no workflow yet.';
		} else {
			const params = { conversation_id: conversationId, workflow_id: workflowId };

			// Goals are optional furniture on this page, so a failure there leaves
			// the empty set rather than blanking the demographics the page exists
			// to show.
			const [report, targets] = await Promise.all([
				api.GetConversationWorkflowParticipationReport({ params }),
				api.ListRecruitmentTargets({ params }).catch((e) => {
					console.warn('ListRecruitmentTargets failed', e);
					return null;
				})
			]);

			const participation = readParticipationReport(report);
			demographics = participation;
			const zips = zipcodeCounts(participation, setup.zipQuestionIds);
			countyCounts = rollUpByCounty(zips);
			mapStates = statesForZipCounts(zips);
			if (targets) goals = targetsToGoals(targets);

			// Live option labels come from the pinned step. Older option ids
			// remain explicitly unknown until the report supplies their labels.
			const enabled = [...setup.defaults, ...setup.custom].filter((question) => question.enabled);
			questions = enabled.map((question) => questionResult(question, participation, goals));
		}
	} catch (e) {
		console.warn('Loading participants failed', e);
		error = describeApiFailure(e);
	}

	return {
		demographics,
		goals,
		countyCounts,
		mapStates,
		questions,
		workflowId,
		conversationId,
		error
	};
};

export const actions: Actions = {
	saveGoals: async ({ request, params, locals }) => {
		const form = await request.formData();
		const api = locals.api;
		const metric = String(form.get('metric') ?? '');
		const conversationId = String(form.get('conversationId') ?? '');
		const workflowId = String(form.get('workflowId') ?? '');

		if (!conversationId || !workflowId) {
			return fail(400, { error: 'Missing conversationId or workflowId.' });
		}
		const isKnownMetric = (METRIC_NAMES as string[]).includes(metric);
		if (!isKnownMetric) {
			try {
				// The report omits questions with no answers, but a Host can set
				// goals before anyone has answered. Read the workflow instead.
				const [conversation, steps] = await Promise.all([
					api.GetConversation({ params: { conversation_id: conversationId } }),
					api.ListConversationWorkflowSteps({
						params: { conversation_id: conversationId, workflow_id: workflowId }
					})
				]);
				const setup = await loadCampaignDemographics(api, {
					organizationId: conversation.organizationId ?? null,
					pollLaunched: true,
					workflowId,
					steps
				});
				if (setup.lock) {
					return fail(502, { error: 'Could not verify this Campaign’s questions.' });
				}
				if (
					![...setup.defaults, ...setup.custom].some(
						(question) => question.id === metric && question.enabled
					)
				) {
					return fail(400, { error: `Unknown metric: ${metric}` });
				}
			} catch (e) {
				console.warn('Verifying the demographic goal failed', e);
				return fail(502, { error: 'Could not verify this Campaign’s questions.' });
			}
		}

		// Parse: for each canonical bucket, either upsert a target_count or clear it.
		const toUpsert: { bucket: string; targetCount: number }[] = [];
		const toClear: string[] = [];

		const collect = (bucket: string, raw: FormDataEntryValue | null) => {
			if (raw == null || String(raw).trim() === '') {
				toClear.push(bucket);
				return null;
			}
			const parsed = Number(raw);
			if (Number.isNaN(parsed) || parsed < 0) {
				return `Invalid count for ${bucket}.`;
			}
			toUpsert.push({ bucket, targetCount: Math.round(parsed) });
			return null;
		};

		if (metric === 'totalParticipants') {
			const err = collect(TOTAL_PARTICIPANTS_BUCKET, form.get('value'));
			if (err) return fail(400, { error: err });
		} else {
			// Buckets are a question's options (or the counties in play), which only
			// the modal that rendered them knows, so read them off the submitted
			// `bucket:*` fields.
			const known = [...form.keys()]
				.filter((k) => k.startsWith('bucket:'))
				.map((k) => k.slice('bucket:'.length));
			for (const bucket of known) {
				const err = collect(bucket, form.get(`bucket:${bucket}`));
				if (err) return fail(400, { error: err });
			}
		}

		const targetParams = { conversation_id: conversationId, workflow_id: workflowId };
		const errors: string[] = [];

		// CreateRecruitmentTarget upserts on (workflow_id, metric, bucket).
		for (const { bucket, targetCount } of toUpsert) {
			try {
				await api.CreateRecruitmentTarget(
					{ metric, bucket, target_count: targetCount },
					{ params: targetParams }
				);
			} catch (e) {
				errors.push(`${bucket}: ${statusOf(e) ?? 'request failed'}`);
			}
		}

		// Deletions: blanked-out fields. We list once and DELETE matches.
		if (toClear.length) {
			let existing: RecruitmentTargetDto[] | null = null;
			try {
				existing = await api.ListRecruitmentTargets({ params: targetParams });
			} catch (e) {
				errors.push(`list ${statusOf(e) ?? 'request failed'}`);
			}

			const cleared = new Set(toClear);
			for (const t of existing ?? []) {
				if (t.metric !== metric || !cleared.has(t.bucket)) continue;
				try {
					await api.DeleteRecruitmentTarget(undefined, {
						params: { ...targetParams, recruitment_target_id: t.id }
					});
				} catch (e) {
					// Already gone is the outcome we wanted.
					const status = statusOf(e);
					if (status !== 404) errors.push(`${t.bucket}: ${status ?? 'request failed'}`);
				}
			}
		}

		if (errors.length) {
			return fail(502, { error: `Failed to save: ${errors.join(', ')}`, slug: params.slug });
		}

		return { success: true, metric };
	}
};
