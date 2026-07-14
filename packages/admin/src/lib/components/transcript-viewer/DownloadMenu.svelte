<script lang="ts">
	import * as Popover from "@civicos/shared/ui/popover";
	import { buttonVariants } from "@civicos/shared/ui/button";
	import { cn } from "@civicos/shared/utils";
	import { Download, FileText, FileBarChart2, FileAudio } from "@lucide/svelte";
	import {
		formatTranscriptMarkdown,
		formatReportMarkdown,
		downloadMarkdown,
	} from "$lib/utils/transcript-markdown";

	interface Props {
		name: string;
		transcriptUrl: string;
		reportUrl: string;
		recordingUrl: string;
	}

	let { name, transcriptUrl, reportUrl, recordingUrl }: Props = $props();

	let open = $state(false);
	let busy = $state<"transcript" | "report" | null>(null);

	async function downloadTranscript() {
		busy = "transcript";
		try {
			const res = await fetch(transcriptUrl);
			if (!res.ok) throw new Error("Failed to fetch transcript");
			const data = await res.json();
			downloadMarkdown(`${name} — Transcript`, formatTranscriptMarkdown(data));
			open = false;
		} catch (err) {
			console.error(err);
		} finally {
			busy = null;
		}
	}

	async function downloadReport() {
		busy = "report";
		try {
			const res = await fetch(reportUrl);
			if (!res.ok) throw new Error("Failed to fetch report");
			const data = await res.json();
			downloadMarkdown(`${name} — Report`, formatReportMarkdown(data));
			open = false;
		} catch (err) {
			console.error(err);
		} finally {
			busy = null;
		}
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(
			buttonVariants({ variant: "secondary" }),
			"h-auto rounded-[30px] px-3 py-2 text-lg leading-6",
		)}
	>
		Download
		<Download class="size-4" />
	</Popover.Trigger>
	<Popover.Content
		align="start"
		sideOffset={8}
		class="w-52 overflow-hidden rounded-xl border border-muted-foreground/20 p-1 shadow-lg"
	>
		<button
			type="button"
			onclick={downloadTranscript}
			disabled={busy !== null}
			class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted disabled:opacity-50"
		>
			<FileText class="size-4 text-primary" />
			{busy === "transcript" ? "Preparing…" : "Transcript"}
		</button>
		<button
			type="button"
			onclick={downloadReport}
			disabled={busy !== null}
			class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted disabled:opacity-50"
		>
			<FileBarChart2 class="size-4 text-primary" />
			{busy === "report" ? "Preparing…" : "Report"}
		</button>
		<a
			href={recordingUrl}
			download={`${name} — Audio`}
			onclick={() => (open = false)}
			class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
		>
			<FileAudio class="size-4 text-primary" />
			Audio
		</a>
	</Popover.Content>
</Popover.Root>
