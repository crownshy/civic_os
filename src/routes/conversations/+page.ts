import type { PageLoad } from '../$types';

export const load: PageLoad = async ({ parent }) => {
	const { region, api } = await parent();

	try {
		const eventResults = await api.ListEvents({
			params: { conversation_id: region.conversationId },
			queries: { start_time: 'asc' }
		});

		return {
			events: eventResults?.records ?? []
		};
	} catch (e) {
		console.error(e);
		return {
			events: []
		};
	}
};
