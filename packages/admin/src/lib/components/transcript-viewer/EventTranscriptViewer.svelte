<script lang="ts">
	import AudioPlayer from "./AudioPlayer.svelte";
	import TranscriptViewer, {
		type TranscriptEvent,
	} from "./TranscriptViewer.svelte";
	import CategoriesPanel, {
		type Topic,
		type Quote,
	} from "./CategoriesPanel.svelte";

	interface Source {
		id: string;
	}

	interface ReportData {
		data?: [unknown, { topics?: Topic[]; sources?: Source[] }];
	}

	interface Props {
		recordingId: string;
		audioUrl: string;
		transcriptionUrl: string;
		reportUrl: string;
	}

	let { recordingId, audioUrl, transcriptionUrl, reportUrl }: Props = $props();

	// TODO: replace placeholder data with a real fetch keyed on recordingId.
	let transcriptData = $state<{ events: TranscriptEvent[] }>({ events: [] });
	let reportData = $state<ReportData>({ data: [null, { topics: [] }] });
	let currentTime = $state(0);
	let audioPlayer = $state<
		{ seekTo: (t: number) => void; play: () => void } | undefined
	>();
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		// Reset state so navigating between recordings shows the spinner
		// instead of flashing the previous recording's data or the empty state.
		loading = true;
		error = null;
		transcriptData = { events: [] };
		reportData = { data: [null, { topics: [] }] };

		(async () => {
			try {
				const [transcriptResponse, reportResponse] = await Promise.all([
					fetch(transcriptionUrl),
					fetch(reportUrl),
				]);

				if (!transcriptResponse.ok || !reportResponse.ok) {
					throw new Error("Failed to load data files");
				}

				transcriptData = await transcriptResponse.json();
				let rawReportData = await reportResponse.json();
				if (typeof rawReportData === "string") {
					reportData = JSON.parse(rawReportData).result;
				}
			} catch (err) {
				error = err instanceof Error ? err.message : "Failed to load data";
			} finally {
				loading = false;
			}
		})();
	});

	function onTimeUpdate(time: number) {
		currentTime = time;
	}

	function onSeek(time: number) {
		currentTime = time;
		if (audioPlayer) {
			audioPlayer.seekTo(time);
		}
	}

	let topics = $derived(reportData?.data?.[1]?.topics ?? []);

	let sourceIdToTime = $derived.by(() => {
		const sources = reportData?.data?.[1]?.sources ?? [];
		const events = transcriptData?.events ?? [];
		const map = new Map<string, number>();
		sources.forEach((src, i) => {
			if (events[i]) map.set(src.id, events[i].start_time);
		});
		return map;
	});

	function onQuoteClick(quote: Quote) {
		const sourceId = quote.reference?.sourceId;
		if (!sourceId) return;
		const time = sourceIdToTime.get(sourceId);
		if (time != null && audioPlayer) {
			audioPlayer.seekTo(time);
			audioPlayer.play();
			currentTime = time;
		}
	}
</script>

<div class="mx-auto flex max-w-[1600px] flex-col lg:h-full lg:overflow-hidden">
	{#if loading}
		<div
			class="text-muted-foreground flex flex-col items-center justify-center gap-4 py-24"
		>
			<div
				class="border-muted border-t-primary size-10 animate-spin rounded-full border-4"
			></div>
			<p>Loading data...</p>
		</div>
	{:else if error}
		<div class="flex items-center justify-center py-24">
			<p class="text-destructive text-lg">Error: {error}</p>
		</div>
	{:else if transcriptData.events.length === 0 && topics.length === 0}
		<div
			class="border-border text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24"
		>
			<p class="text-body font-medium">No recording data available yet</p>
			<p class="text-caption">
				Recording <code class="bg-muted rounded px-1.5 py-0.5"
					>{recordingId}</code
				> will appear here once processing is wired up.
			</p>
		</div>
	{:else}
		<div
			class="grid grid-cols-2 gap-5 max-lg:grid-cols-1 lg:min-h-0 lg:flex-1"
		>
			<CategoriesPanel {topics} {onQuoteClick} />
			<div class="flex flex-col lg:min-h-0">
				<AudioPlayer
					bind:this={audioPlayer}
					audioSrc={audioUrl}
					bind:currentTime
					{onTimeUpdate}
					{onSeek}
				/>
				<TranscriptViewer
					events={transcriptData.events}
					{currentTime}
					{onSeek}
				/>
			</div>
		</div>
	{/if}
</div>
