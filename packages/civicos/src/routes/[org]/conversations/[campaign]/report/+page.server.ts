import { createApiClient } from '@crownshy/api-client/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, cookies, url, depends }) => {
	depends('report:data');

	const { campaign, region } = await parent();
	const conversationId = campaign.id;

	// The Campaign's own step, mirrored into `metadata.poll` when admin published
	// it, because the Polis workflow step is 401 anonymously.
	//
	// `regions.ts` stays behind it only for a legacy region, where the region IS
	// the Campaign. It used to be the only source, which handed every Campaign
	// created in admin the USA catch-all's step and rendered the catch-all's
	// report under that Host's name. See #401.
	const workflowStepId =
		campaign.poll?.workflowStepId ??
		(campaign.isLegacyRegion ? region.polis_workflow_step_id : undefined);

	const empty = (error: string) => {
		console.warn('[Report]', error);
		return { report: null, demographics: null, error, region };
	};

	if (!conversationId) {
		return empty(`No Conversation resolved for "${campaign.slug}"`);
	}
	if (!workflowStepId) {
		return empty(`No Polis workflow step on Campaign "${campaign.slug}"`);
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
