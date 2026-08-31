import { campaignPath } from '@civicos/shared/data/place';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
	const { campaign, api } = await parent();
	const { slug } = params;

	try {
		const event = await api.GetEvent({
			params: { conversation_id: campaign.id, event_id: slug }
		});

		return { event };
	} catch (e) {
		console.error(e);

		redirect(302, campaignPath(params.campaign, params.org, `events`));
	}
};
