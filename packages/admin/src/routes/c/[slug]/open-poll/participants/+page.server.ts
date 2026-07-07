import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { comhairleFetch } from '$lib/server/comhairle';
import {
	emptyGoals,
	METRIC_BUCKETS,
	TOTAL_PARTICIPANTS_BUCKET,
	type GoalMetric,
	type RegionGoals
} from '$lib/config/representation-goals';
import { countiesForPrefixes, rollUpByCounty } from '@civicos/shared/data/zipcodes';

interface DemographicCategory {
	category: string;
	count: number;
	value?: string | null;
}

export interface DemographicReport {
	ageRanges: DemographicCategory[];
	ethnicity: DemographicCategory[];
	gender: DemographicCategory[];
	politicalParty: DemographicCategory[];
	totalParticipants: number;
	zipcodeCounts: Record<string, number>;
}

interface WorkflowDto {
	id: string;
	name: string;
	conversationId?: string | null;
	isActive: boolean;
}

interface RecruitmentTargetDto {
	id: string;
	workflowId: string;
	metric: string;
	bucket: string;
	targetCount: number;
	createdAt: string;
	updatedAt: string;
}

const METRIC_NAMES: GoalMetric[] = [
	'totalParticipants',
	'ethnicity',
	'politicalParty',
	'ageRanges',
	'gender',
	'county'
];

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
		}
	}
	return goals;
}

async function fetchWorkflowId(
	conversationId: string,
	authToken: string | undefined
): Promise<string> {
	const wfRes = await comhairleFetch(`/conversation/${conversationId}/workflow`, authToken);
	if (!wfRes.ok) throw new Error(`workflows ${wfRes.status}`);
	const workflows = (await wfRes.json()) as WorkflowDto[];
	if (!workflows.length) throw new Error('no workflows for conversation');
	return workflows[0].id;
}

export const load: PageServerLoad = async ({ parent, cookies, depends }) => {
	depends('open-poll:demographics');
	depends('open-poll:goals');

	const { region } = await parent();
	const authToken = cookies.get('auth-token');
	const conversationId = region.conversationId;

	let demographics: DemographicReport | null = null;
	let goals: RegionGoals = emptyGoals();
	let workflowId: string | null = null;
	let error: string | null = null;

	// Zip counts roll up into counties (scoped to this region's zip prefixes so
	// cross-state county names never collide). Empty for regions with no prefixes.
	let countyCounts: Record<string, number> = {};
	// The county universe for goal-setting; empty for the generic/all region.
	const regionCounties = countiesForPrefixes(region.zipPrefixes);

	try {
		workflowId = await fetchWorkflowId(conversationId, authToken);

		const [dRes, tRes] = await Promise.all([
			comhairleFetch(
				`/conversation/${conversationId}/workflow/${workflowId}/participation_report`,
				authToken
			),
			comhairleFetch(
				`/conversation/${conversationId}/workflow/${workflowId}/recruitment_targets`,
				authToken
			)
		]);

		if (!dRes.ok) throw new Error(`participation_report ${dRes.status}`);
		demographics = (await dRes.json()) as DemographicReport;
		countyCounts = rollUpByCounty(demographics.zipcodeCounts ?? {}, region.zipPrefixes);

		if (tRes.ok) {
			const targets = (await tRes.json()) as RecruitmentTargetDto[];
			goals = targetsToGoals(targets);
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}

	return { demographics, goals, countyCounts, regionCounties, workflowId, conversationId, error };
};

export const actions: Actions = {
	saveGoals: async ({ request, cookies, params }) => {
		const form = await request.formData();
		const authToken = cookies.get('auth-token');
		const metric = String(form.get('metric') ?? '');
		const conversationId = String(form.get('conversationId') ?? '');
		const workflowId = String(form.get('workflowId') ?? '');

		if (!conversationId || !workflowId) {
			return fail(400, { error: 'Missing conversationId or workflowId.' });
		}
		if (!(METRIC_NAMES as string[]).includes(metric)) {
			return fail(400, { error: `Unknown metric: ${metric}` });
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
				metric === 'county'
					? [...form.keys()]
							.filter((k) => k.startsWith('bucket:'))
							.map((k) => k.slice('bucket:'.length))
					: METRIC_BUCKETS[metric as Exclude<GoalMetric, 'totalParticipants'>];
			for (const bucket of known) {
				const err = collect(bucket, form.get(`bucket:${bucket}`));
				if (err) return fail(400, { error: err });
			}
		}

		const errors: string[] = [];

		// Upserts via POST (the API upserts on workflow_id+metric+bucket).
		for (const { bucket, targetCount } of toUpsert) {
			const res = await comhairleFetch(
				`/conversation/${conversationId}/workflow/${workflowId}/recruitment_targets`,
				authToken,
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ metric, bucket, target_count: targetCount })
				}
			);
			if (!res.ok) errors.push(`${bucket}: ${res.status}`);
		}

		// Deletions: blanked-out fields. We list once and DELETE matches.
		if (toClear.length) {
			const listRes = await comhairleFetch(
				`/conversation/${conversationId}/workflow/${workflowId}/recruitment_targets`,
				authToken
			);
			if (listRes.ok) {
				const existing = (await listRes.json()) as RecruitmentTargetDto[];
				const cleared = new Set(toClear);
				for (const t of existing) {
					if (t.metric !== metric || !cleared.has(t.bucket)) continue;
					const dRes = await comhairleFetch(
						`/conversation/${conversationId}/workflow/${workflowId}/recruitment_targets/${t.id}`,
						authToken,
						{ method: 'DELETE' }
					);
					if (!dRes.ok && dRes.status !== 404) errors.push(`${t.bucket}: ${dRes.status}`);
				}
			} else {
				errors.push(`list ${listRes.status}`);
			}
		}

		if (errors.length) {
			return fail(502, { error: `Failed to save: ${errors.join(', ')}`, slug: params.slug });
		}

		return { success: true, metric };
	}
};
