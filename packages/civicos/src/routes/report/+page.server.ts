import { createApiClient } from '@crownshy/api-client/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, url, depends }) => {
	depends('report:data');

	const region = locals.region;
	const conversationId = region.conversationId;
	// Still read from `regions.ts` rather than resolved from the Campaign's
	// workflow steps the way admin does it. See #401.
	const workflowStepId = region.polis_workflow_step_id;

	const empty = (error: string) => {
		console.warn('[Report]', error);
		return { report: null, demographics: null, error, region };
	};

	if (!conversationId) {
		return empty(`No conversationId configured for region "${region.slug}"`);
	}
	if (!workflowStepId) {
		return empty(`No Polis workflow step configured for region "${region.slug}"`);
	}

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	try {
		const workflows = await api.ListConversationWorkflows({
			params: { conversation_id: conversationId }
		});
		const workflow = workflows[0];
		if (!workflow) {
			return empty(`No workflows found for conversation ${conversationId}`);
		}

		// Demographics are supporting detail on this page, so losing them still
		// leaves a readable report rather than the error state.
		const [report, demographics] = await Promise.all([
			api.PolisGetReportData({ queries: { workflow_step_id: workflowStepId } }),
			api
				.GetConversationWorkflowParticipationReport({
					params: { conversation_id: conversationId, workflow_id: workflow.id }
				})
				.catch((e) => {
					console.warn('[Report] Demographics unavailable:', e);
					return null;
				})
		]);

		return { report, demographics, error: null, region };
	} catch (e) {
		console.error('[Report] Failed to load report data:', e);
		return {
			report: null,
			demographics: null,
			error: e instanceof Error ? e.message : String(e),
			region
		};
	}
};
