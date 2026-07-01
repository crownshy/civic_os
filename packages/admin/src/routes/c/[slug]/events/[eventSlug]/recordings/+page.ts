import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, depends }) => {
	depends(`recordings:list:${params.eventSlug}`);

	const { api, region } = await parent();

	try {
		const recordings = await api.ListAudioRecordings({
			params: { conversation_id: region.conversationId, event_id: params.eventSlug }
		});
		return { recordings, recordingsFailed: false };
	} catch (e) {
		console.error('ListAudioRecordings failed', e);
		return { recordings: [], recordingsFailed: true };
	}
};
