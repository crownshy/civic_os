<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import type { ThemeSummary } from '$lib/types/report';
	import Meter from '$lib/components/Meter.svelte';

	interface Props {
		summary: ThemeSummary;
		/** Statement count of the largest theme — the bar's full-scale reference. */
		barMax: number;
		onclick?: () => void;
	}

	let { summary, barMax, onclick }: Props = $props();

	// Bar length ranks this theme against the largest theme (100% = the top theme),
	// per the "very simple, based on manually added themes" spec. Theme counts don't
	// sum to totalStatements (a statement can carry many themes), so share-of-total
	// would be a meaningless denominator. No controversy signal here (that lives in
	// CONTEXT.md but is intentionally not surfaced).
	const pct = $derived(barMax > 0 ? (summary.statementCount / barMax) * 100 : 0);
</script>

<div
	class="group grid grid-cols-[10rem_3rem_1fr_2.5rem] items-center gap-6 border-b border-border px-2 py-4 transition-colors duration-150 hover:bg-muted/40"
>
	<div class="truncate text-h4 font-bold text-foreground">{summary.theme}</div>
	<div class="text-right font-ui text-h4 font-bold text-foreground tabular-nums">
		{summary.statementCount}
	</div>
	<Meter class="w-full" fill={pct} fillClass="bg-theme-bar" />
	<button
		type="button"
		{onclick}
		aria-label={`Open ${summary.theme}`}
		class="flex size-8 shrink-0 cursor-pointer items-center justify-center justify-self-end rounded-full bg-muted text-primary transition-all duration-150 group-hover:bg-primary/15 hover:scale-110 active:scale-95"
	>
		<ArrowRight class="size-4" />
	</button>
</div>
