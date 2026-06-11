<script lang="ts">
	import { Pencil } from '@lucide/svelte';

	interface Row {
		label: string;
		count: number;
		/** Optional goal count. If provided, % to goal + bar color reflect this. */
		goal?: number;
	}

	interface Props {
		title: string;
		rows: Row[];
		/** Total respondents (denominator for "% of total") */
		total: number;
		/** Total participants in the conversation (for the "n = X (Y% of respondents)" caption) */
		participantCount?: number;
		showGoals?: boolean;
		onModifyGoals?: () => void;
	}

	let {
		title,
		rows,
		total,
		participantCount,
		showGoals = true,
		onModifyGoals
	}: Props = $props();

	const respondentPct = $derived(
		participantCount ? Math.round((total / participantCount) * 100) : null
	);
</script>

<section
	class="border-border overflow-hidden rounded-2xl border bg-background"
>
	<header class="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
		<div>
			<h2 class="text-3xl font-bold leading-tight">{title}</h2>
			<p class="mt-2 text-sm">
				<span class="font-medium">n = {total}</span>
				{#if respondentPct !== null}
					<span class="text-foreground/50 font-medium"
						>({respondentPct}% of respondents)</span
					>
				{/if}
			</p>
		</div>
		{#if showGoals}
			<button
				type="button"
				onclick={onModifyGoals}
				class="bg-muted text-destructive flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium"
			>
				<Pencil class="size-3.5" />
				Modify Goals
			</button>
		{/if}
	</header>

	<!-- Column headings -->
	<div
		class="text-foreground/30 grid grid-cols-[2fr_3fr_auto_auto_auto_auto] items-center gap-6 px-6 pt-4 pb-2 text-xs font-semibold uppercase"
	>
		<div>Category</div>
		<div>Progress</div>
		<div class="w-12 text-right">Count</div>
		<div class="w-20 text-right">% of total</div>
		{#if showGoals}
			<div class="w-12 text-right">Goal</div>
			<div class="w-16 text-right">% to goal</div>
		{:else}
			<div></div>
			<div></div>
		{/if}
	</div>

	<div class="divide-border divide-y">
		{#each rows as row}
			{@const pctOfTotal = total > 0 ? (row.count / total) * 100 : 0}
			{@const pctToGoal = row.goal && row.goal > 0 ? (row.count / row.goal) * 100 : null}
			{@const reachedGoal = pctToGoal !== null && pctToGoal >= 100}
			<div
				class="grid grid-cols-[2fr_3fr_auto_auto_auto_auto] items-center gap-6 px-6 py-3"
			>
				<div class="truncate text-sm font-bold">{row.label}</div>

				<!-- Progress bar (% of respondents in this category) -->
				<div class="relative h-3 w-full max-w-[220px] overflow-hidden rounded border border-zinc-100 bg-neutral-100">
					<div
						class={`h-full ${reachedGoal ? 'bg-green-500' : 'bg-orange-600'}`}
						style:width={`${Math.min(100, pctOfTotal)}%`}
					></div>
					{#if row.goal !== undefined && row.goal > 0 && total > 0}
						{@const goalPct = (row.goal / total) * 100}
						<!-- Goal tick mark -->
						<div
							class="absolute top-0 bottom-0 w-px bg-stone-400"
							style:left={`${Math.min(100, goalPct)}%`}
						></div>
					{/if}
				</div>

				<div class="w-12 text-right text-sm font-bold">{row.count}</div>
				<div class="w-20 text-right text-sm font-bold">
					{Math.round(pctOfTotal)}%
				</div>

				{#if showGoals}
					<div class="w-12 text-right text-sm font-bold">
						{row.goal ?? '—'}
					</div>
					<div
						class={`w-16 text-right text-sm font-bold ${reachedGoal ? 'text-green-600' : 'text-orange-600'}`}
					>
						{pctToGoal === null ? '—' : `${Math.round(pctToGoal)}%`}
					</div>
				{:else}
					<div></div>
					<div></div>
				{/if}
			</div>
		{/each}
	</div>
</section>
