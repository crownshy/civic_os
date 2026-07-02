<script lang="ts">
	import { FileAudio, LoaderCircle, Plus, TriangleAlert } from "@lucide/svelte";
	import type { AudioRecordingStatus } from "@crownshy/api-client/api";
	import { invalidate } from "$app/navigation";
	import UploadRecordingModal from "$lib/components/UploadRecordingModal.svelte";
	import { page } from "$app/state";

	let { data } = $props();

	const recordings = $derived(data.recordings ?? []);

	const api = $derived(data.api);
	const conversationId = $derived(data.region.conversationId);
	const eventId = $derived(data.eventId);
	const existingNames = $derived(recordings.map((r) => r.name));

	let uploadOpen = $state(false);

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

	function statusLabel(status: AudioRecordingStatus): string {
		switch (status) {
			case "awaiting_upload":
				return "awaiting upload";
			case "transcribing":
				return "transcribing";
			case "categorizing":
				return "categorizing";
			case "complete":
				return "complete";
			case "transcription_failed":
				return "transcript error";
			case "categorization_failed":
				return "report error";
		}
	}

	function statusTone(
		status: AudioRecordingStatus,
	): "done" | "failed" | "progress" {
		if (status === "complete") return "done";
		if (status === "transcription_failed" || status === "categorization_failed")
			return "failed";
		return "progress";
	}

	const toneClass: Record<"done" | "failed" | "progress", string> = {
		done: "text-primary bg-primary/10",
		failed: "text-destructive bg-destructive/10",
		progress: "text-muted-foreground bg-muted-foreground/10",
	};

	const toneDot: Record<"done" | "failed" | "progress", string> = {
		done: "bg-primary",
		failed: "bg-destructive",
		progress: "bg-muted-foreground/60",
	};
</script>

<div class="space-y-4">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h3 class="text-body font-bold">All Recordings</h3>
			<p class="text-caption text-muted-foreground">
				Select a recording below to view its transcript and analysis.
			</p>
		</div>
		<button
			type="button"
			onclick={() => (uploadOpen = true)}
			class="text-caption inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-primary-foreground"
		>
			<Plus class="size-3" /> Upload New Recording
		</button>
	</div>

	<UploadRecordingModal
		bind:open={uploadOpen}
		{api}
		{conversationId}
		{eventId}
		{existingNames}
		onUploaded={refreshRecordings}
	/>

	{#if data.recordingsFailed}
		<div
			class="text-body rounded-lg bg-card p-6 text-muted-foreground shadow-card"
		>
			Couldn't load recordings. Please try again.
		</div>
	{:else if recordings.length === 0}
		<div
			class="text-body rounded-lg bg-card p-6 text-muted-foreground shadow-card"
		>
			No recordings yet. Upload one to get started.
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each recordings as rec, i (rec.id)}
				{@const tone = statusTone(rec.status)}
				<a href={`${page.url}/${rec.id}`}>
					<div
						class="flex items-start gap-3 rounded-lg bg-card p-4 shadow-card"
					>
						<div class="flex w-4 shrink-0 items-center justify-center pt-0.5">
							{#if tone === "progress"}
								<LoaderCircle
									class="size-4 animate-spin text-muted-foreground"
									aria-label="Processing"
								/>
							{:else if tone === "failed"}
								<TriangleAlert
									class="size-4 text-destructive"
									aria-label="Error"
								/>
							{:else}
								<span class="text-caption font-bold text-primary">{i + 1}</span>
							{/if}
						</div>
						<div class="min-w-0 flex-1 space-y-1.5">
							<div class="flex items-center gap-1.5">
								<FileAudio class="size-3.5 shrink-0 text-muted-foreground" />
								<span class="text-body truncate font-bold">{rec.name}</span>
							</div>
							<div
								class="text-caption flex items-center gap-2 text-muted-foreground"
							>
								<span
									class={`inline-flex shrink-0 items-center gap-1 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl px-2.5 py-0.5 ${toneClass[tone]}`}
								>
									<span class={`size-1.5 rounded-full ${toneDot[tone]}`}></span>
									{statusLabel(rec.status)}
								</span>
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
