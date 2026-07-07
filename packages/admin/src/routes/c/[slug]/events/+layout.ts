import type { LayoutLoad } from './$types';

// Shared events list for the conversation. Hoisted here so both the events index
// page and the per-event layout's event-switcher dropdown read the same data via
// `await parent()` / layout-data merge, with one `events:list` cache key.
export const load: LayoutLoad = async ({ parent, depends }) => {
	depends('events:list');

	const { api, region } = await parent();

	try {
		const result = await api.ListEvents({
			params: { conversation_id: region.conversationId },
			queries: { start_time: 'asc' }
		});
		return { events: result?.records ?? [] };
	} catch (e) {
		console.error('ListEvents failed', e);
		return { events: [] };
	}
};
