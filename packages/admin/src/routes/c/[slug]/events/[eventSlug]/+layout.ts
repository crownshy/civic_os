import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params, depends }) => {
	depends(`events:detail:${params.eventSlug}`);

	const { api, campaign } = await parent();

	try {
		const event = await api.GetEvent({
			params: { conversation_id: campaign.id, event_id: params.eventSlug }
		});
		return { event };
	} catch (e) {
		console.error('GetEvent failed', e);
		return { event: null };
	}
};
