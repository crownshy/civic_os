import { campaignPath } from '@civicos/shared/data/place';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, data }) => {
	const { campaign, api } = await parent();
	const { slug } = params;

	try {
		const event = await api.GetEvent({
			params: { conversation_id: campaign.id, event_id: slug }
		});

		// `data` is the server load's answer on this route: whether the attendance
		// list already names this participant (#420).
		return { ...data, event };
	} catch (e) {
		console.error(e);

		redirect(302, campaignPath(params.campaign, params.org, `events`));
	}
};
