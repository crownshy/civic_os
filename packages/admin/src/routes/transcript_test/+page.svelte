<script lang="ts">
	import EventTranscriptViewer from "$lib/components/transcript-viewer/EventTranscriptViewer.svelte";

	const recordingId = "blah";
	const audioUrl = "/recording.wav";
	const transcriptionUrl = "/transcript.json";
	const reportUrl = "/report.json";
</script>

<EventTranscriptViewer
	{recordingId}
	{audioUrl}
	{transcriptionUrl}
	{reportUrl}
/>
