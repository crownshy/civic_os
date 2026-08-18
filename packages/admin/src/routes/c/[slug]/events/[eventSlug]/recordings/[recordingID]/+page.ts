import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, depends }) => {
	depends(`recording:view:${params.recordingID}`);

	const { api, campaign, event } = await parent();

	if (!event) {
		return { recording: null, error: 'Failed to find recording' };
	}

	try {
		const result = await api.GetAudioRecording({
			params: { conversation_id: campaign.id, event_id: event.id, recording_id: params.recordingID },
		});

		return { recording: result, error: null };
	} catch (e) {
		console.error('ListEvents failed', e);
		return { recording: null, error: "Failed to find recording" };
	}
};
