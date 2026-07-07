<script lang="ts">
	import { LoaderCircle, TriangleAlert, Plus, Upload } from "@lucide/svelte";
	import type { AudioRecordingStatus } from "@crownshy/api-client/api";
	import { invalidate } from "$app/navigation";
	import { Button } from "@civicos/shared/ui/button";
	import Card from "@civicos/shared/ui/Card.svelte";
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

	// Card outline per state: primary accent for ready/processing, warning hues
	// for upload / pipeline errors (kept distinct from the destructive token).
	const outlineClass: Record<CardTone, string> = {
		ready: "outline-primary/40",
		processing: "outline-primary/40",
		"upload-error": "outline-orange-500",
		"pipeline-error": "outline-yellow-500",
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
		<Card class="rounded-[30px] p-6 text-body text-muted-foreground">
			Couldn't load recordings. Please try again.
		</Card>
	{:else if recordings.length === 0}
		<!-- Empty state -->
		<h2 class="text-3xl font-bold">
			{data.event?.name ?? "Recordings"}
		</h2>
		<Card
			class="flex h-[543px] max-h-[70vh] flex-col items-center justify-center gap-4 rounded-[30px] px-6 text-center"
		>
			<div
				class="flex size-36 items-center justify-center rounded-full border-8 border-primary text-primary"
			>
				<Upload class="size-14" />
			</div>
			<h3 class="max-w-2xl text-4xl font-bold text-foreground">
				Upload an audio recording from your event.
			</h3>
			<p class="max-w-lg text-2xl font-medium text-muted-foreground">
				One at a time. .mp3, .m4a, .wav all accepted.
			</p>
			<Button
				class="mt-2 h-auto rounded-[45px] px-4 py-3 text-2xl leading-8"
				onclick={() => (uploadOpen = true)}
			>
				Upload Recordings
			</Button>
		</Card>
	{:else}
		<div class="flex items-end justify-between gap-4">
			<div>
				<h2 class="text-4xl font-bold">All Recordings</h2>
				<p class="mt-1 text-lg font-medium">
					Select a recording below to view its transcript and analysis.
				</p>
			</div>
			<Button
				class="h-auto shrink-0 rounded-[45px] px-4 py-3 text-xl leading-6"
				onclick={() => (uploadOpen = true)}
			>
				<Plus class="size-5" /> Upload New Recording
			</Button>
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
									class="size-5 animate-spin text-primary"
									aria-label="Opening"
								/>
							{:else if tone === "processing"}
								<LoaderCircle
									class="size-5 animate-spin text-primary"
									aria-label="Processing"
								/>
							{:else if tone === "upload-error"}
								<TriangleAlert
									class="size-5 text-orange-500"
									aria-label="Upload error"
								/>
							{:else if tone === "pipeline-error"}
								<TriangleAlert
									class="size-5 text-yellow-500"
									aria-label="Error"
								/>
							{:else}
								<span class="text-lg font-bold leading-6 text-primary"
									>{i + 1}</span
								>
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="truncate text-2xl font-bold text-foreground">
								{rec.name}
							</div>
							<div class="mt-0.5 text-sm">
								{#if tone === "upload-error"}
									<span class="font-bold text-orange-600">Upload Error. Retry?</span>
								{:else if rec.status === "transcription_failed"}
									<span class="font-bold text-yellow-700">Transcript Error</span>
								{:else if rec.status === "categorization_failed"}
									<span class="font-bold text-yellow-700">Report Error</span>
								{:else if rec.status === "transcribing"}
									<span class="text-muted-foreground">Transcribing…</span>
								{:else if rec.status === "categorizing"}
									<span class="text-muted-foreground">Analyzing…</span>
								{:else}
									<span class="text-muted-foreground"
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
						class={`block h-20 overflow-hidden rounded-[10px] px-5 py-4 outline outline-1 transition-opacity ${outlineClass[tone]} ${pending ? "pointer-events-none opacity-60" : ""} ${i === 0 ? "bg-muted" : ""}`}
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
