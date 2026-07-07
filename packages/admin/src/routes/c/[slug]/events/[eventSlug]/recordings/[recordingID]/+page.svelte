<script lang="ts">
	import EventTranscriptViewer from "$lib/components/transcript-viewer/EventTranscriptViewer.svelte";
	import { page } from "$app/state";

	let { data } = $props();
	let { error, recording } = $derived(data);

	const basePath = $derived(
		`/c/${page.params.slug}/events/${page.params.eventSlug}/recordings`,
	);
	const conversationTitle = $derived(
		data.conversation?.title ?? data.region?.heroHeader ?? "",
	);
	const recordingRefs = $derived(
		(Array.isArray(data.recordings) ? data.recordings : []).map((r) => ({
			id: r.id,
			name: r.name,
		})),
	);
</script>

{#if error}
	<h1 class="text-2xl font-bold">{error}</h1>
{/if}

{#if recording}
	<EventTranscriptViewer
		recordingId={recording.recording.id}
		name={recording.recording.name}
		status={recording.recording.status}
		{conversationTitle}
		recordings={recordingRefs}
		{basePath}
		recordingsPath={basePath}
		transcriptionUrl={recording.downloads.transcriptUrl}
		reportUrl={recording.downloads.reportUrl}
		audioUrl={recording.downloads.recordingUrl}
	/>
{/if}
