<script lang="ts">
	import { LoaderCircle, TriangleAlert } from "@lucide/svelte";
	import type { AudioRecordingStatus } from "@crownshy/api-client/api";
	import { invalidate } from "$app/navigation";
	import UploadRecordingModal from "$lib/components/UploadRecordingModal.svelte";
	import { page, navigating } from "$app/state";

	let { data } = $props();

	const recordings = $derived(
		Array.isArray(data.recordings) ? data.recordings : [],
	);

	const api = $derived(data.api);
	const conversationId = $derived(data.region.conversationId);
	const eventId = $derived(data.eventId);
	const existingNames = $derived(recordings.map((r) => r.name));

	let uploadOpen = $state(false);

	// Id of the recording whose detail page is currently being navigated to,
	// so we can show a loading indicator on the clicked card immediately.
	const pendingId = $derived(navigating.to?.params?.recordingID ?? null);

	function refreshRecordings() {
		return invalidate(`recordings:list:${eventId}`);
	}

	const hasInFlight = $derived(
		recordings.some(
			(r) => r.status === "transcribing" || r.status === "categorizing",
		),
	);

	$effect(() => {
		if (!hasInFlight) return;
		const interval = setInterval(refreshRecordings, 10000);
		return () => clearInterval(interval);
	});

	type CardTone = "ready" | "processing" | "upload-error" | "pipeline-error";

	function cardTone(status: AudioRecordingStatus): CardTone {
		switch (status) {
			case "complete":
				return "ready";
			case "transcribing":
			case "categorizing":
				return "processing";
			case "awaiting_upload":
				return "upload-error";
			case "transcription_failed":
			case "categorization_failed":
				return "pipeline-error";
		}
	}

	// Outline color per Figma: success/processing red-400, upload error orange-600,
	// transcript/report error yellow-400.
	const outlineClass: Record<CardTone, string> = {
		ready: "outline-red-400",
		processing: "outline-red-400",
		"upload-error": "outline-orange-600",
		"pipeline-error": "outline-yellow-400",
	};

	function extLabel(ext: string) {
		return `.${ext.toLowerCase()}`;
	}

	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	}
</script>

<div class="space-y-6">
	{#if data.recordingsFailed}
		<div
			class="rounded-[30px] bg-white p-6 text-body text-muted-foreground outline outline-1 outline-black/30"
		>
			Couldn't load recordings. Please try again.
		</div>
	{:else if recordings.length === 0}
		<!-- Empty state -->
		<h2 class="text-3xl font-bold">
			{data.event?.name ?? "Recordings"}
		</h2>
		<div
			class="relative flex h-[543px] max-h-[70vh] flex-col items-center justify-center gap-4 rounded-[30px] bg-white px-6 text-center outline outline-1 outline-black/30"
		>
			<!-- Upload glyph: circle + notch -->
			<div
				class="flex size-36 items-center justify-center rounded-full border-8 border-red-500"
			>
				<div class="h-16 w-14 bg-red-500"></div>
			</div>
			<h3 class="max-w-2xl text-4xl font-bold text-neutral-900">
				Upload an audio recording from your event.
			</h3>
			<p class="max-w-lg text-2xl font-medium text-neutral-500">
				One at a time. .mp3, .m4a, .wav all accepted.
			</p>
			<button
				type="button"
				onclick={() => (uploadOpen = true)}
				class="mt-2 inline-flex cursor-pointer items-center rounded-[45px] bg-red-500 px-4 py-3 text-2xl font-medium leading-8 text-white"
			>
				Upload Recordings
			</button>
		</div>
	{:else}
		<div class="flex items-end justify-between gap-4">
			<div>
				<h2 class="text-4xl font-bold">All Recordings</h2>
				<p class="mt-1 text-lg font-medium">
					Select a recording below to view its transcript and analysis.
				</p>
			</div>
			<button
				type="button"
				onclick={() => (uploadOpen = true)}
				class="inline-flex shrink-0 cursor-pointer items-center rounded-[45px] bg-red-500 px-4 py-3 text-xl font-medium leading-6 text-white"
			>
				Upload New Recording
			</button>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each recordings as rec, i (rec.id)}
				{@const tone = cardTone(rec.status)}
				{@const pending = pendingId === rec.id}
				{#snippet cardInner()}
					<div class="flex items-center gap-3">
						<!-- Leading marker -->
						<div class="flex size-6 shrink-0 items-center justify-center">
							{#if pending}
								<LoaderCircle
									class="size-5 animate-spin text-red-500"
									aria-label="Opening"
								/>
							{:else if tone === "processing"}
								<LoaderCircle
									class="size-5 animate-spin text-red-500"
									aria-label="Processing"
								/>
							{:else if tone === "upload-error"}
								<TriangleAlert
									class="size-5 text-orange-600"
									aria-label="Upload error"
								/>
							{:else if tone === "pipeline-error"}
								<TriangleAlert
									class="size-5 text-yellow-500"
									aria-label="Error"
								/>
							{:else}
								<span class="text-lg font-bold leading-6 text-red-500"
									>{i + 1}</span
								>
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="truncate text-2xl font-bold text-black">{rec.name}</div>
							<div class="mt-0.5 text-sm">
								{#if tone === "upload-error"}
									<span class="font-bold text-orange-600">Upload Error. Retry?</span>
								{:else if rec.status === "transcription_failed"}
									<span class="font-bold text-yellow-700">Transcript Error</span>
								{:else if rec.status === "categorization_failed"}
									<span class="font-bold text-yellow-700">Report Error</span>
								{:else if rec.status === "transcribing"}
									<span class="text-black">Transcribing…</span>
								{:else if rec.status === "categorizing"}
									<span class="text-black">Analyzing…</span>
								{:else}
									<span class="text-black"
										>{extLabel(rec.fileExtension)} · {fmtDate(rec.createdAt)}</span
									>
								{/if}
							</div>
						</div>
					</div>
				{/snippet}

				{#if tone === "upload-error"}
					<button
						type="button"
						onclick={() => (uploadOpen = true)}
						class={`h-20 w-full cursor-pointer overflow-hidden rounded-[10px] px-5 py-4 text-left outline outline-1 ${outlineClass[tone]}`}
					>
						{@render cardInner()}
					</button>
				{:else}
					<a
						href={`${page.url}/${rec.id}`}
						class={`block h-20 overflow-hidden rounded-[10px] px-5 py-4 outline outline-1 transition-opacity ${outlineClass[tone]} ${pending ? "pointer-events-none opacity-60" : ""} ${i === 0 ? "bg-stone-50" : ""}`}
						aria-busy={pending}
					>
						{@render cardInner()}
					</a>
				{/if}
			{/each}
		</div>
	{/if}

	<UploadRecordingModal
		bind:open={uploadOpen}
		{api}
		{conversationId}
		{eventId}
		{existingNames}
		onUploaded={refreshRecordings}
	/>
</div>
