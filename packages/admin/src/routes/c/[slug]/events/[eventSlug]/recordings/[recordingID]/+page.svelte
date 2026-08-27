<script lang="ts">
	import EventTranscriptViewer from '$lib/components/transcript-viewer/EventTranscriptViewer.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { invalidate } from '$app/navigation';

	let { data } = $props();
	let { error, recording } = $derived(data);

	const basePath = $derived(
		resolve(`/c/${page.params.slug}/events/${page.params.eventSlug}/recordings`)
	);
	const conversationTitle = $derived(data.conversation?.title ?? data.campaign.title);
	const recordingRefs = $derived(
		(Array.isArray(data.recordings) ? data.recordings : []).map((r) => ({
			id: r.id,
			name: r.name
		}))
	);

	// Transcription finishes server-side with nothing to push the result here. The
	// recordings list already polls its own key while a job runs; without the same
	// poll, a recording opened mid-transcription sits on "processing" until reload.
	const inFlight = $derived(
		recording?.recording.status === 'transcribing' || recording?.recording.status === 'categorizing'
	);

	$effect(() => {
		if (!inFlight) return;
		const id = page.params.recordingID;
		const interval = setInterval(() => invalidate(`recording:view:${id}`), 10000);
		return () => clearInterval(interval);
	});
</script>

{#if error}
	<h1 class="text-h3 font-bold md:text-h2">{error}</h1>
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
