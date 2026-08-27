<script lang="ts">
	import EventTranscriptViewer from '$lib/components/transcript-viewer/EventTranscriptViewer.svelte';
	import { resolve } from '$app/paths';

	const recordings = [{ id: 'blah', name: 'Plenary' }];
</script>

<div class="p-6">
	<EventTranscriptViewer
		recordingId="blah"
		name="Plenary"
		status="complete"
		conversationTitle="Demo Conversation"
		{recordings}
		basePath={resolve('/transcript_test')}
		recordingsPath={resolve('/transcript_test')}
		audioUrl="/recording.wav"
		transcriptionUrl="/transcript.json"
		reportUrl="/report.json"
	/>
</div>
