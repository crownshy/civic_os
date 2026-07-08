<script lang="ts">
	import Card from "@civicos/shared/ui/Card.svelte";
	import TranscriptRail, {
		type TranscriptEvent,
	} from "./TranscriptRail.svelte";
	import ThemeSection, {
		type Subtopic,
		type Quote,
	} from "./ThemeSection.svelte";
	import RecordingSwitcher from "./RecordingSwitcher.svelte";
	import DownloadMenu from "./DownloadMenu.svelte";
	import type { AudioRecordingStatus } from "@crownshy/api-client/api";

	interface Topic {
		id: string;
		title: string;
		subtopics?: Subtopic[];
	}
	interface Source {
		id: string;
	}
	interface ReportData {
		data?: [unknown, { topics?: Topic[]; sources?: Source[] }];
	}
	interface RecordingRef {
		id: string;
		name: string;
	}

	interface Props {
		recordingId: string;
		name: string;
		status: AudioRecordingStatus;
		conversationTitle: string;
		audioUrl: string;
		transcriptionUrl: string;
		reportUrl: string;
		recordings: RecordingRef[];
		basePath: string;
		recordingsPath: string;
	}

	let {
		recordingId,
		name,
		status,
		conversationTitle,
		audioUrl,
		transcriptionUrl,
		reportUrl,
		recordings,
		basePath,
		recordingsPath,
	}: Props = $props();

	const pipelineFailed = $derived(
		status === "transcription_failed" || status === "categorization_failed",
	);
	// Neutral, non-error state: the row exists but its audio hasn't finished
	// uploading yet, so there's no transcript/report to fetch.
	const awaitingUpload = $derived(status === "awaiting_upload");

	let transcriptData = $state<{ events: TranscriptEvent[] }>({ events: [] });
	let reportData = $state<ReportData>({ data: [null, { topics: [] }] });
	let rail = $state<TranscriptRail | undefined>();
	let loading = $state(true);
	let fetchError = $state(false);

	$effect(() => {
		// Reset when navigating between recordings so the spinner shows instead of
		// flashing the previous recording's data.
		loading = true;
		fetchError = false;
		transcriptData = { events: [] };
		reportData = { data: [null, { topics: [] }] };

		if (pipelineFailed || awaitingUpload) {
			loading = false;
			return;
		}

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
				const raw = await reportResponse.json();
				if (typeof raw === "string") {
					reportData = JSON.parse(raw).result;
				} else {
					reportData = raw;
				}
			} catch {
				fetchError = true;
			} finally {
				loading = false;
			}
		})();
	});

	const topics = $derived(reportData?.data?.[1]?.topics ?? []);
	// Chips = topic titles; theme sections = every subtopic across topics.
	const subtopics = $derived(topics.flatMap((t) => t.subtopics ?? []));

	const sourceIdToTime = $derived.by(() => {
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
		if (time != null && rail) {
			rail.seekTo(time);
			rail.play();
		}
	}

	const showError = $derived(pipelineFailed || fetchError);
</script>

<Card class="flex rounded-[30px] max-lg:flex-col lg:h-[600px]">
	{#if loading}
		<div
			class="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-muted-foreground"
		>
			<div
				class="size-10 animate-spin rounded-full border-4 border-muted border-t-primary"
			></div>
			<p>Loading recording…</p>
		</div>
	{:else}
		<!-- Left: header + themes -->
		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			<div class="shrink-0 px-10 pt-10 pb-4">
				<div class="text-sm font-medium uppercase text-muted-foreground">
					From “{conversationTitle}”
				</div>
				<div class="mt-1 flex flex-wrap items-center gap-3">
					<RecordingSwitcher
						{name}
						{recordings}
						currentId={recordingId}
						{basePath}
						{recordingsPath}
					/>
					{#if !showError && !awaitingUpload}
						<DownloadMenu
							{name}
							transcriptUrl={transcriptionUrl}
							{reportUrl}
							recordingUrl={audioUrl}
						/>
					{/if}
				</div>

				{#if !showError && !awaitingUpload && topics.length > 0}
					<div class="mt-4 flex flex-wrap gap-2">
						{#each topics as topic (topic.id)}
							<span
								class="rounded-[3px] bg-muted px-[5px] py-[3px] text-sm font-medium uppercase text-amber-800"
							>
								{topic.title}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			{#if awaitingUpload}
				<div
					class="flex flex-1 flex-col items-center justify-center gap-4 px-10 text-center"
				>
					<h2 class="text-4xl font-bold text-foreground">
						Upload in progress.
					</h2>
					<p class="max-w-lg text-xl font-medium text-muted-foreground">
						This recording is still uploading — please check back later. If you
						need to try again, add a new recording or contact <a
							href="mailto:hello@bloom-project.org"
							class="text-primary underline">hello@bloom-project.org.</a
						>
					</p>
				</div>
			{:else if showError}
				<div
					class="flex flex-1 flex-col items-center justify-center gap-4 px-10 text-center"
				>
					<h2 class="text-4xl font-bold text-foreground">We have a problem.</h2>
					<p class="max-w-lg text-xl font-medium text-muted-foreground">
						There was an issue in creating the report. If this problem persists,
						contact <a
							href="mailto:hello@bloom-project.org"
							class="text-primary underline">hello@bloom-project.org.</a
						>
					</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-y-auto">
					{#each subtopics as subtopic, i (subtopic.id)}
						<ThemeSection {subtopic} open={i === 0} {onQuoteClick} />
					{/each}
				</div>
			{/if}
		</div>

		<!-- Right: transcript rail -->
		{#if transcriptData.events.length > 0}
			<TranscriptRail
				bind:this={rail}
				events={transcriptData.events}
				audioSrc={audioUrl}
			/>
		{/if}
	{/if}
</Card>
