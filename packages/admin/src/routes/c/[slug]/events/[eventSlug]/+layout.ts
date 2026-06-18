import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params, depends }) => {
	depends(`events:detail:${params.eventSlug}`);

	const { api, region } = await parent();

	try {
		const event = await api.GetEvent({
			params: { conversation_id: region.conversationId, event_id: params.eventSlug }
		});
		return { event };
	} catch (e) {
		console.error('GetEvent failed', e);
		return { event: null };
	}
};
