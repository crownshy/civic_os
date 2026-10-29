import { serverApi } from '@civicos/shared/api';
import { requireCampaign } from '../require-campaign';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params, cookies, url, depends }) => {
	depends('report:data');

	const { campaign } = requireCampaign(await parent(), params.campaign);
	const conversationId = campaign.id;

	// The Campaign's own step, which `pollFor` takes from `metadata.poll` and only
	// for a legacy region from `regions.ts`. Using the region unconditionally
	// rendered the USA catch-all's report under another Host's name (#401).
	const workflowStepId = campaign.poll?.workflowStepId;

	const empty = (error: string) => {
		console.warn('[Report]', error);
		return { report: null, demographics: null, error };
	};

	if (!conversationId) {
		return empty(`No Conversation resolved for "${campaign.slug}"`);
	}
	if (!workflowStepId) {
		return empty(`No Polis workflow step on Campaign "${campaign.slug}"`);
	}

	const api = serverApi(url, cookies.get('auth-token'));

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
				.catch((e: unknown) => {
					console.warn('[Report] Demographics unavailable:', e);
					return null;
				})
		]);

		return { report, demographics, error: null };
	} catch (e) {
		console.error('[Report] Failed to load report data:', e);
		return {
			report: null,
			demographics: null,
			error: e instanceof Error ? e.message : String(e)
		};
	}
};
