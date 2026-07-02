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
	let loading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
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
				reportData = await reportResponse.json();
				if (typeof reportData === "string") {
					console.log("Parsing report data");
					reportData = JSON.parse(reportData);
				}
				loading = false;
			} catch (err) {
				error = err.message;
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

	$inspect(reportData);
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

<div class="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden">
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
		<AudioPlayer
			bind:this={audioPlayer}
			audioSrc={audioUrl}
			bind:currentTime
			{onTimeUpdate}
			{onSeek}
		/>

		<div
			class="grid min-h-0 flex-1 grid-cols-2 grid-rows-1 gap-5 max-lg:grid-cols-1 max-lg:grid-rows-[auto_auto] max-lg:overflow-y-auto"
		>
			<TranscriptViewer events={transcriptData.events} {currentTime} {onSeek} />
			<CategoriesPanel {topics} {onQuoteClick} />
		</div>
	{/if}
</div>
