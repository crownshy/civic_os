<script lang="ts">
	import { Pencil } from '@lucide/svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import Meter from './Meter.svelte';

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

	/**
	 * Fraction of the track where the goal line sits. The fill reaches this point
	 * exactly when a category hits 100% of its goal; exceeding the goal extends
	 * the fill past the marker into the remaining headroom (fill caps at the track
	 * end, i.e. once a category reaches ~133% of goal). Categories with no goal
	 * fall back to plain share-of-total and render no marker.
	 */
	const GOAL_ANCHOR = 75;
</script>

<Card class="hover:border-muted-foreground/40 shadow-card transition-colors duration-200">
	<header class="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
		<div>
			<h2 class="text-display font-semibold">{title}</h2>
			<p class="text-section mt-1">
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
		class="text-foreground/40 text-caption grid grid-cols-[2fr_3fr_auto_auto_auto_auto] items-center gap-6 px-6 pt-4 pb-2 font-semibold uppercase"
	>
		<div>Category</div>
		<div>Progress</div>
		<div class="w-14 text-right">Count</div>
		<div class="w-20 text-right">% of total</div>
		{#if showGoals}
			<div class="w-14 text-right">Goal</div>
			<div class="w-20 text-right">% to goal</div>
		{:else}
			<div></div>
			<div></div>
		{/if}
	</div>

	<div class="divide-border divide-y">
		{#each rows as row (row.label)}
			{@const pctOfTotal = total > 0 ? (row.count / total) * 100 : 0}
			{@const pctToGoal = row.goal && row.goal > 0 ? (row.count / row.goal) * 100 : null}
			{@const barColor =
				pctToGoal === null
					? 'bg-orange-600'
					: pctToGoal >= 100
						? 'bg-green-600'
						: pctToGoal >= 50
							? 'bg-amber-500'
							: 'bg-orange-600'}
			{@const goalTextColor =
				pctToGoal === null
					? 'text-orange-600'
					: pctToGoal >= 100
						? 'text-green-600'
						: pctToGoal >= 50
							? 'text-amber-500'
							: 'text-orange-600'}
			<!-- Goal-relative fill: hitting the goal reaches the marker (GOAL_ANCHOR%),
			     overshoot extends past it. No goal → plain share-of-total. -->
			{@const fillPct =
				pctToGoal === null
					? Math.min(100, pctOfTotal)
					: Math.min(100, (pctToGoal / 100) * GOAL_ANCHOR)}
			<div
				class="text-section hover:bg-muted/40 grid grid-cols-[2fr_3fr_auto_auto_auto_auto] items-center gap-6 px-6 py-4 transition-colors duration-150"
			>
				<div class="truncate font-bold">{row.label}</div>

				<!-- Distribution bar -->
				<Meter
					class="w-full"
					fill={fillPct}
					fillClass={barColor}
					marker={pctToGoal !== null ? GOAL_ANCHOR : null}
				/>

				<div class="w-14 text-right font-bold">{row.count}</div>
				<div class="w-20 text-right font-bold">{Math.round(pctOfTotal)}%</div>

				{#if showGoals}
					<div class="w-14 text-right font-bold">{row.goal ?? '—'}</div>
					<div class={`w-20 text-right font-bold ${goalTextColor}`}>
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
