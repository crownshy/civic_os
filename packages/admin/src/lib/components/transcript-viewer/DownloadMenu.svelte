<script lang="ts">
	import * as Popover from "@civicos/shared/ui/popover";
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
		class="inline-flex items-center gap-1.5 rounded-[30px] bg-stone-50 px-3 py-2 text-lg font-medium leading-6 text-red-500 outline-none"
	>
		Download
		<Download class="size-4" />
	</Popover.Trigger>
	<Popover.Content
		align="start"
		sideOffset={8}
		class="w-52 overflow-hidden rounded-2xl border border-black/20 p-1 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
	>
		{#each items as item (item.label)}
			<a
				href={item.href}
				download={`${name} — ${item.label}`}
				onclick={() => (open = false)}
				class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-base font-medium text-black hover:bg-stone-50"
			>
				<item.icon class="size-4 text-red-500" />
				{item.label}
			</a>
		{/each}
	</Popover.Content>
</Popover.Root>
