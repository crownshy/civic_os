import type { PaginatedResults_for_LocalizedEventDto } from '@crownshy/api-client/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { campaign, api } = await parent();

	try {
		// Annotated because api-client 0.0.66-rc.0 types this endpoint as any.
		const eventResults: PaginatedResults_for_LocalizedEventDto = await api.ListEvents({
			params: { conversation_id: campaign.id },
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
