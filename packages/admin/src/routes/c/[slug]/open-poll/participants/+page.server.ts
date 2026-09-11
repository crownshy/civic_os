import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createApiClient } from '$lib/api/client';
import { describeApiFailure } from '$lib/api/describe-failure';
import type { DemographicReport, RecruitmentTargetDto } from '@crownshy/api-client/api';
import {
	emptyGoals,
	METRIC_BUCKETS,
	TOTAL_PARTICIPANTS_BUCKET,
	type GoalMetric,
	type RegionGoals
} from '$lib/config/representation-goals';
import { countiesForPrefixes, rollUpByCounty } from '@civicos/shared/data/zipcodes';
import { statesForZipCounts } from '@civicos/shared/data/zip-states';

const METRIC_NAMES: GoalMetric[] = [
	'totalParticipants',
	'ethnicity',
	'politicalParty',
	'ageRanges',
	'gender',
	'county'
];

/** HTTP status of a failed api-client call, absent when it never reached the server. */
function statusOf(e: unknown): number | undefined {
	return (e as { response?: { status?: number } })?.response?.status;
}

/**
 * `DemographicReport.zipcodeCounts` is generated as `z.record(z.number().int())`,
 * but zod 4 wants `z.record(key, value)`, so the single-argument call loses the
 * key type and TS infers `Record<number, unknown>`. The runtime shape is zip
 * code to participant count, which is what both rollups take. Drop this once
 * the api-client regenerates against zod 4.
 */
function zipCounts(report: DemographicReport): Record<string, number> {
	return (report.zipcodeCounts ?? {}) as Record<string, number>;
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

export const load: PageServerLoad = async ({ parent, cookies, url, depends }) => {
	depends('open-poll:demographics');
	depends('open-poll:goals');

	const { campaign, customDemographics } = await parent();
	const enabledCustomDemographics = customDemographics.filter((question) => question.enabled);
	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
	const conversationId = campaign.id;

	let demographics: DemographicReport | null = null;
	let goals: RegionGoals = emptyGoals();
	let workflowId: string | null = null;
	let error: string | null = null;

	// Zip counts roll up into counties (scoped to this region's zip prefixes so
	// cross-state county names never collide). Empty for regions with no prefixes.
	let countyCounts: Record<string, number> = {};
	// The county universe for goal-setting; empty for the generic/all region.
	const regionCounties = countiesForPrefixes(campaign.zipPrefixes);
	// USPS state codes the choropleth needs, derived from where participants
	// actually live (scoped like the county rollup). Empty ⇒ no map to draw.
	let mapStates: string[] = [];
	let customDemographicResults: {
		slug: string;
		displayName: string;
		rows: { label: string; count: number, goal?: number }[];
	}[] = [];

	try {
		const workflows = await api.ListConversationWorkflows({
			params: { conversation_id: conversationId }
		});
		workflowId = workflows[0]?.id ?? null;

		if (!workflowId) {
			error = 'this Campaign has no workflow yet.';
		} else {
			const params = { conversation_id: conversationId, workflow_id: workflowId };

			// Goals are optional furniture on this page, so a failure there leaves
			// the empty set rather than blanking the demographics the page exists
			// to show.
			const [report, targets, customResponses] = await Promise.all([
				api.GetConversationWorkflowParticipationReport({ params }),
				api.ListRecruitmentTargets({ params }).catch((e) => {
					console.warn('ListRecruitmentTargets failed', e);
					return null;
				}),
				Promise.all(
					enabledCustomDemographics.map(async (question) => ({
						question,
						responses: await api
							.GetDemographicsResponses({
								queries: {
									conversation_id: conversationId,
									question_slug: question.slug,
									limit: 1000
								}
							})
							.then((result) => result.records)
							.catch((e) => {
								console.warn(`GetDemographicsResponses failed for ${question.slug}`, e);
								return [];
							})
					}))
				)
			]);

			demographics = report;
			const zips = zipCounts(report);
			countyCounts = rollUpByCounty(zips, campaign.zipPrefixes);
			mapStates = statesForZipCounts(zips, campaign.zipPrefixes);
			if (targets) goals = targetsToGoals(targets);

			customDemographicResults = customResponses.map(({ question, responses }) => {
				const counts = new Map<string, number>();
				for (const response of responses) {
					const label = String(response.value);
					counts.set(label, (counts.get(label) ?? 0) + 1);
				}
				const labels = [...question.options, ...counts.keys()].filter(
					(label, index, all) => all.indexOf(label) === index
				);
				return {
					slug: question.slug,
					displayName: question.displayName,
					rows: labels.map((label) => ({
						label,
						count: counts.get(label) ?? 0,
						goal: goals.custom[question.slug]?.[label]
					}))
				};
			});
		}
	} catch (e) {
		console.warn('Loading participants failed', e);
		error = describeApiFailure(e);
	}

	return {
		demographics,
		goals,
		countyCounts,
		regionCounties,
		mapStates,
		customDemographicResults,
		workflowId,
		conversationId,
		error
	};
};

export const actions: Actions = {
	saveGoals: async ({ request, cookies, params, url }) => {
		const form = await request.formData();
		const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
		const metric = String(form.get('metric') ?? '');
		const conversationId = String(form.get('conversationId') ?? '');
		const workflowId = String(form.get('workflowId') ?? '');

		if (!conversationId || !workflowId) {
			return fail(400, { error: 'Missing conversationId or workflowId.' });
		}
		const isKnownMetric = (METRIC_NAMES as string[]).includes(metric);
		if (!isKnownMetric) {
			try {
				const relationships = await api.GetConversationDemographics({
					queries: { conversation_id: conversationId, question_slug: metric, limit: 1 }
				});
				if (!relationships.records.some((relationship) => relationship.questionSlug === metric)) {
					return fail(400, { error: `Unknown metric: ${metric}` });
				}
			} catch {
				return fail(400, { error: `Unknown metric: ${metric}` });
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
			// County buckets are per-region, not static — read them from the submitted
			// `bucket:*` fields. Other metrics validate against their canonical list.
			const known =
				metric === 'county' || !isKnownMetric
					? [...form.keys()]
							.filter((k) => k.startsWith('bucket:'))
							.map((k) => k.slice('bucket:'.length))
					: METRIC_BUCKETS[metric as Exclude<GoalMetric, 'totalParticipants'>];
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
