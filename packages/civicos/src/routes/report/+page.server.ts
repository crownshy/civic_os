import type { PageServerLoad } from './$types';
import type { WikiPollReport } from '$lib/types/report';

interface WorkflowDto {
	id: string;
	name: string;
	conversationId?: string | null;
	isActive: boolean;
}

interface WorkflowStepDto {
	id: string;
	name: string;
	stepOrder: number;
	previewToolConfig: { type: string; poll_id?: string; [key: string]: unknown };
	toolConfig?: { type: string; poll_id?: string; [key: string]: unknown } | null;
}

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

export const load: PageServerLoad = async ({ locals, fetch, url }) => {
	const region = locals.region;
	const conversationId = region.conversationId;

	console.log(
		'[Report] Loading report for region:',
		region.slug,
		'| conversationId:',
		conversationId
	);

	async function fetchApi<T>(path: string): Promise<T> {
		const apiUrl = `${url.origin}/api${path}`;
		console.log('[Report]   → GET', apiUrl);
		const res = await fetch(apiUrl);
		if (!res.ok) {
			const body = await res.text();
			console.error('[Report]   ✗', res.status, body.slice(0, 200));
			throw new Error(`${path} → ${res.status}: ${body.slice(0, 200)}`);
		}
		console.log('[Report]   ✓', res.status);
		return res.json();
	}

	if (!conversationId) {
		const msg = `No conversationId configured for region "${region.slug}"`;
		console.warn('[Report]', msg);
		return { report: null, demographics: null, error: msg, region };
	}

	try {
		const workflows = await fetchApi<WorkflowDto[]>(`/conversation/${conversationId}/workflow`);

		if (!workflows.length) {
			const msg = `No workflows found for conversation ${conversationId}`;
			console.warn('[Report]', msg);
			return { report: null, demographics: null, error: msg, region };
		}

		const workflow = workflows[0];
		console.log('[Report] Using workflow:', workflow.id, workflow.name);

		// const steps = await fetchApi<WorkflowStepDto[]>(
		// 	`/conversation/${conversationId}/workflow/${workflow.id}/workflow_step`
		// );
		// console.log('[Report] Found', steps.length, 'workflow steps:', steps.map((s: WorkflowStepDto) => `${s.name} (${s.previewToolConfig?.type || s.toolConfig?.type || '?'})`));
		//
		// const polisStep = steps.find(
		// 	(s: WorkflowStepDto) =>
		// 		s.previewToolConfig?.type === 'polis' ||
		// 		s.toolConfig?.type === 'polis'
		// );
		//
		// if (!polisStep) {
		// 	const msg = `No Polis workflow step found in ${steps.length} steps`;
		// 	console.warn('[Report]', msg);
		// 	return { report: null, demographics: null, error: msg, region };
		// }
		// console.log('[Report] Found Polis step:', polisStep.id, polisStep.name);

		const report = await fetchApi<WikiPollReport>(
			`/tools/polis/report_data?workflow_step_id=${region.polis_workflow_step_id}`
		);
		console.log(
			'[Report] Got report:',
			report.comments?.length,
			'comments,',
			report.groups?.length,
			'groups,',
			report.participants?.length,
			'participants'
		);

		let demographics: DemographicReport | null = null;
		try {
			demographics = await fetchApi<DemographicReport>(
				`/conversation/${conversationId}/workflow/${workflow.id}/participation_report`
			);
		} catch (e) {
			console.warn('[Report] Failed to fetch demographics:', e.message);
		}

		return { report, demographics, error: null, region };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.error('[Report] Failed to fetch report data:', msg);
		return { report: null, demographics: null, error: msg, region };
	}
};
