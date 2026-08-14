import { countEvents } from '$lib/api/campaigns';
import { listCampaignSummaries } from '$lib/api/campaigns';
import type { CampaignSummary } from '$lib/types/campaign';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, depends }) => {
	depends('campaigns:events');

	const { api, campaigns, campaignsError } = await parent();

	const conversations = await Promise.all(
		campaigns.map(async (c) => ({
			...c,
			eventCount: c.conversationId ? await countEvents(api, c.conversationId) : 0
		}))
	);

	return { conversations };
};
