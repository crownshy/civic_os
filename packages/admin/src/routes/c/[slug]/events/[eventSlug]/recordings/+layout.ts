
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params, depends }) => {
	depends(`recordings:list:${params.eventSlug}`);

	const { api, region } = await parent();

	try {
		const result = await api.ListAudioRecordings({
			params: { conversation_id: region.conversationId, event_id: params.eventSlug }
		});
		// On SSR the api client is unauthenticated, so the /api proxy redirects to
		// the login page and this can resolve to HTML/an error object instead of an
		// array. Normalize to an array so rendering never crashes; the client re-runs
		// this load after hydration (with cookies) and gets the real list.
		const recordings = Array.isArray(result) ? result : [];
		return { recordings, recordingsFailed: false, eventId: params.eventSlug };
	} catch (e) {
		console.error('ListAudioRecordings failed', e);
		return { recordings: [], recordingsFailed: true, eventId: params.eventSlug };
	}
};
