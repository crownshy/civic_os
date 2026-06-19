<script lang="ts">
	import { page } from "$app/state";
	import EventTranscriptViewer from "$lib/components/transcript-viewer/EventTranscriptViewer.svelte";

	const recordingId = $derived(page.params.recordingId ?? "");
	const audioUrl = "";
	const transcriptionUrl = "";
	const reportUrl = "";
</script>

<EventTranscriptViewer
	{recordingId}
	{audioUrl}
	{transcriptionUrl}
	{reportUrl}
/>
