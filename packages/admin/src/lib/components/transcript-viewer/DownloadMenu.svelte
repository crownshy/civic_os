<script lang="ts">
	import * as Popover from "@civicos/shared/ui/popover";
	import { buttonVariants } from "@civicos/shared/ui/button";
	import { cn } from "@civicos/shared/utils";
	import { Download, FileText, FileBarChart2, FileAudio } from "@lucide/svelte";

	interface Props {
		name: string;
		transcriptUrl: string;
		reportUrl: string;
		recordingUrl: string;
	}

	let { name, transcriptUrl, reportUrl, recordingUrl }: Props = $props();

	let open = $state(false);

	const items = $derived([
		{ label: "Transcript", href: transcriptUrl, icon: FileText },
		{ label: "Report", href: reportUrl, icon: FileBarChart2 },
		{ label: "Audio", href: recordingUrl, icon: FileAudio },
	]);
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
		{#each items as item (item.label)}
			<a
				href={item.href}
				download={`${name} — ${item.label}`}
				onclick={() => (open = false)}
				class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
			>
				<item.icon class="size-4 text-primary" />
				{item.label}
			</a>
		{/each}
	</Popover.Content>
</Popover.Root>
