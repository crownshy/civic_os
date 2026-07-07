<script lang="ts">
	import * as Popover from "@civicos/shared/ui/popover";
	import { ChevronDown, Check, ArrowRight } from "@lucide/svelte";

	interface RecordingRef {
		id: string;
		name: string;
	}

	interface Props {
		name: string;
		recordings: RecordingRef[];
		currentId: string;
		/** Path prefix for a recording detail page; `${basePath}/${id}` is the link. */
		basePath: string;
		/** Path to the recordings list ("Go to Recordings →"). */
		recordingsPath: string;
	}

	let { name, recordings, currentId, basePath, recordingsPath }: Props = $props();

	let open = $state(false);
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class="flex items-center gap-2 text-4xl font-bold text-foreground outline-none"
	>
		{name}
		<ChevronDown class="size-6 text-primary" />
	</Popover.Trigger>
	<Popover.Content
		align="start"
		sideOffset={8}
		class="w-72 overflow-hidden rounded-2xl border border-muted-foreground/20 p-0 shadow-lg"
	>
		{#each recordings as rec (rec.id)}
			{@const active = rec.id === currentId}
			<a
				href={`${basePath}/${rec.id}`}
				onclick={() => (open = false)}
				class={`flex items-center justify-between gap-2 border-b border-border px-5 py-4 text-xl font-bold ${active ? "text-primary" : "text-foreground hover:bg-muted"}`}
			>
				<span class="truncate">{rec.name}</span>
				{#if active}
					<Check class="size-4 shrink-0 text-primary" />
				{/if}
			</a>
		{/each}
		<a
			href={recordingsPath}
			onclick={() => (open = false)}
			class="flex items-center justify-center gap-1.5 px-5 py-6 text-base font-bold text-primary hover:bg-muted"
		>
			Go to Recordings <ArrowRight class="size-4" />
		</a>
	</Popover.Content>
</Popover.Root>
