import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, depends }) => {
	depends(`recording:view:${params.recordingID}`);

	const { api, region, event } = await parent();

	try {
		const result = await api.GetAudioRecording({
			params: { conversation_id: region.conversationId, event_id: event.id, recording_id: params.recordingID },
		});

		return { recording: result, error: null };
	} catch (e) {
		console.error('ListEvents failed', e);
		return { recording: null, error: "Failed to find recording" };
	}
};
