<script lang="ts">
	import EventTranscriptViewer from "$lib/components/transcript-viewer/EventTranscriptViewer.svelte";

	let { data } = $props();
	let { error, recording } = $derived(data);
</script>

{#if error}
	<h1>{error}</h1>
{/if}

{#if recording}
	<EventTranscriptViewer
		recordingId={recording.recording.id}
		transcriptionUrl={recording.downloads.transcriptUrl}
		reportUrl={recording.downloads.reportUrl}
		audioUrl={recording.downloads.recordingUrl}
	/>
{/if}
