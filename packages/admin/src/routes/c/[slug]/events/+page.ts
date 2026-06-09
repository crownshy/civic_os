import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
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
