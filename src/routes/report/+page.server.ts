import type { PageServerLoad } from './$types';
import type { WikiPollReport } from '$lib/types/report';
import { createApiClient } from '@crownshy/api-client/client';
import type { DemographicReport } from '@crownshy/api-client/api';

export type { DemographicReport };

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	const region = locals.region;
	const conversationId = region.conversationId;
	const authToken = cookies.get('auth-token');
	const api = createApiClient(`${url.origin}/api`, authToken, 'server');

	console.log('[Report] Loading report for region:', region.slug, '| conversationId:', conversationId);

	if (!conversationId) {
		const msg = `No conversationId configured for region "${region.slug}"`;
		console.warn('[Report]', msg);
		return { report: null, demographics: null, error: msg, region };
	}

	try {
		const workflows = await api.ListConversationWorkflows({
			params: { conversation_id: conversationId }
		});

		if (!workflows.length) {
			const msg = `No workflows found for conversation ${conversationId}`;
			console.warn('[Report]', msg);
			return { report: null, demographics: null, error: msg, region };
		}

		const workflow = workflows[0];
		console.log('[Report] Using workflow:', workflow.id, workflow.name);

		// Use axios directly because the API spec types this response as z.void()
		const reportRes = await api.axios.get<WikiPollReport>(
			'/tools/polis/report_data',
			{ params: { workflow_step_id: region.polis_workflow_step_id } }
		);
		const report = reportRes.data;
		console.log('[Report] Got report:', report.comments?.length, 'comments,', report.groups?.length, 'groups,', report.participants?.length, 'participants');

		let demographics: DemographicReport | null = null;
		try {
			demographics = await api.GetConversationWorkflowParticipationReport({
				params: { conversation_id: conversationId, workflow_id: workflow.id }
			});
		} catch (e) {
			console.warn('[Report] Failed to fetch demographics:', (e as Error).message);
		}

		return { report, demographics, error: null, region };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.error('[Report] Failed to fetch report data:', msg);
		return { report: null, demographics: null, error: msg, region };
	}
};
