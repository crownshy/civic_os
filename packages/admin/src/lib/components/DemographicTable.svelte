<script lang="ts">
	import { Pencil } from '@lucide/svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';

	interface Row {
		label: string;
		count: number;
		/** Optional goal count. If provided, % to goal + bar color reflect this. */
		goal?: number;
	}

	interface Props {
		title: string;
		rows: Row[];
		total: number;
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

<Card class="hover:border-muted-foreground/40 shadow-card transition-colors duration-200">
	<header class="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
		<div>
			<h2 class="text-section font-bold">{title}</h2>
			<p class="text-caption mt-1">
				<span class="font-medium">n = {total}</span>
				{#if respondentPct !== null}
					<span class="text-foreground/50 font-medium">({respondentPct}% of respondents)</span>
				{/if}
			</p>
		</div>
		{#if showGoals}
			<Button
				size="sm"
				variant="outline"
				onclick={onModifyGoals}
				class="bg-muted border-transparent text-destructive hover:bg-muted-foreground/20 hover:border-destructive/40 rounded-full transition-all hover:scale-105 active:scale-95"
			>
				<Pencil class="size-3.5" />
				Modify Goals
			</Button>
		{/if}
	</header>

	<!-- Column headings -->
	<div
		class="text-foreground/40 text-label grid grid-cols-[2fr_3fr_auto_auto_auto_auto] items-center gap-6 px-6 pt-4 pb-2 font-semibold uppercase"
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
		{#each rows as row (row.label)}
			{@const pctOfTotal = total > 0 ? (row.count / total) * 100 : 0}
			{@const pctToGoal = row.goal && row.goal > 0 ? (row.count / row.goal) * 100 : null}
			{@const reachedGoal = pctToGoal !== null && pctToGoal >= 100}
			<div
				class="text-caption hover:bg-muted/40 grid grid-cols-[2fr_3fr_auto_auto_auto_auto] items-center gap-6 px-6 py-2.5 transition-colors duration-150"
			>
				<div class="truncate font-semibold">{row.label}</div>

				<!-- Progress bar -->
				<div
					class="relative h-3 w-full max-w-[220px] overflow-hidden rounded border border-zinc-100 bg-neutral-100"
				>
					<div
						class={`h-full transition-all duration-300 ${reachedGoal ? 'bg-green-500' : 'bg-orange-600'}`}
						style:width={`${Math.min(100, pctOfTotal)}%`}
					></div>
					{#if row.goal !== undefined && row.goal > 0 && total > 0}
						{@const goalPct = (row.goal / total) * 100}
						<div
							class="absolute top-0 bottom-0 w-px bg-stone-400"
							style:left={`${Math.min(100, goalPct)}%`}
						></div>
					{/if}
				</div>

				<div class="w-12 text-right font-semibold">{row.count}</div>
				<div class="w-20 text-right font-semibold">{Math.round(pctOfTotal)}%</div>

				{#if showGoals}
					<div class="w-12 text-right font-semibold">{row.goal ?? '—'}</div>
					<div
						class={`w-16 text-right font-semibold ${reachedGoal ? 'text-green-600' : 'text-orange-600'}`}
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
</Card>
