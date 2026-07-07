<script lang="ts">
	import EventTranscriptViewer from "$lib/components/transcript-viewer/EventTranscriptViewer.svelte";

	const recordings = [{ id: "blah", name: "Plenary" }];
</script>

<div class="p-6">
	<EventTranscriptViewer
		recordingId="blah"
		name="Plenary"
		status="complete"
		conversationTitle="Demo Conversation"
		{recordings}
		basePath="/transcript_test"
		recordingsPath="/transcript_test"
		audioUrl="/recording.wav"
		transcriptionUrl="/transcript.json"
		reportUrl="/report.json"
	/>
</div>
