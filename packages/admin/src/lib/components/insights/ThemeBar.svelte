<script lang="ts">
	import { ChevronRight } from '@lucide/svelte';
	import type { ThemeSummary } from '$lib/types/report';
	import Meter from '$lib/components/Meter.svelte';

	interface Props {
		summary: ThemeSummary;
		total: number;
		onclick?: () => void;
	}

	let { summary, total, onclick }: Props = $props();

	const pct = $derived(total > 0 ? (summary.statementCount / total) * 100 : 0);

	const controversyPill = $derived(
		summary.controversy === 'high'
			? { label: 'High controversy', class: 'bg-stone-50 text-destructive' }
			: summary.controversy === 'moderate'
				? { label: 'Moderate controversy', class: 'bg-neutral-50 text-muted-foreground' }
				: { label: 'Low controversy', class: 'bg-primary/20 text-teal-700' }
	);

	// TODO: how do we calculate unique participant count per theme? per-vote pid
	// data is not in /tools/polis/report_data today, so we render an X placeholder.
	const peopleCount = 'X';
</script>

<div
	class="border-border group hover:bg-muted/40 flex items-center gap-6 rounded-md border-b px-2 py-3 transition-colors duration-150"
>
	<div class="flex w-56 shrink-0 flex-col gap-0.5">
		<div class="text-foreground truncate text-body font-bold">{summary.theme}</div>
		<div class="text-muted-foreground text-caption">
			{summary.statementCount} claims by {peopleCount} people
		</div>
	</div>

	{#if summary.subtopics?.length}
		<div class="flex shrink-0 items-center gap-1.5">
			{#each summary.subtopics as sub (sub)}
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground cursor-pointer text-body underline underline-offset-2 transition-colors"
				>
					{sub}
				</button>
			{/each}
		</div>
	{/if}

	<div class="text-foreground w-10 shrink-0 text-right text-body font-bold tabular-nums">
		{summary.statementCount}
	</div>
	<div class="text-foreground w-12 shrink-0 text-right text-body font-bold tabular-nums">
		{Math.round(pct)}%
	</div>

	<Meter class="flex-1" fill={pct} />

	<span
		class={`shrink-0 rounded-full px-3 py-1.5 text-caption font-medium ${controversyPill.class}`}
	>
		{controversyPill.label}
	</span>

	<button
		type="button"
		{onclick}
		aria-label={`Open ${summary.theme}`}
		class="bg-muted text-destructive hover:bg-destructive hover:text-destructive-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-150 hover:scale-110 active:scale-95 group-hover:bg-destructive/15"
	>
		<ChevronRight class="size-4" />
	</button>
</div>
