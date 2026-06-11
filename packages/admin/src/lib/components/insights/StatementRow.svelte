<script lang="ts">
	import type { ReportComment, ReportGroup } from '$lib/types/report';
	import { computeGroupVotePercents, totalVotes } from '$lib/utils/report';
	import GroupCircle from './GroupCircle.svelte';

	type Variant = 'consensus' | 'difference' | 'uncertainty' | 'neutral';

	interface Props {
		index: number;
		comment: ReportComment;
		groups: ReportGroup[];
		variant?: Variant;
		/** Show the "consensus" / "difference" pill on the left of the text. */
		showVerdictPill?: boolean;
	}

	let { index, comment, groups, variant = 'neutral', showVerdictPill = false }: Props = $props();

	const groupPcts = $derived(computeGroupVotePercents(comment, groups));
	const count = $derived(totalVotes(comment));

	const accentClass = $derived(
		variant === 'consensus'
			? 'bg-primary'
			: variant === 'difference'
				? 'bg-destructive'
				: variant === 'uncertainty'
					? 'bg-muted-foreground/30'
					: 'bg-transparent'
	);

	const verdictPill = $derived(
		variant === 'consensus'
			? { label: 'consensus', class: 'bg-primary text-primary-foreground' }
			: variant === 'difference'
				? { label: 'difference', class: 'bg-destructive text-destructive-foreground' }
				: variant === 'uncertainty'
					? { label: 'uncertainty', class: 'bg-muted-foreground/20 text-muted-foreground' }
					: null
	);
</script>

<div class="border-border relative flex items-stretch gap-4 border-b py-4 pl-4">
	<!-- Left accent bar -->
	<div class={`absolute top-0 bottom-0 left-0 w-1.5 ${accentClass}`}></div>

	<!-- Index -->
	<div class="text-muted-foreground w-6 shrink-0 pt-0.5 text-center text-xs">
		{index}
	</div>

	<!-- Statement text + tags -->
	<div class="min-w-0 flex-1">
		<p class="text-foreground text-sm leading-5">{comment.text}</p>
		<div class="mt-2 flex flex-wrap items-center gap-1.5">
			{#if showVerdictPill && verdictPill}
				<span
					class={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${verdictPill.class}`}
				>
					{verdictPill.label}
				</span>
			{/if}
			{#each comment.topics ?? [] as topic (topic)}
				<span
					class="bg-destructive/10 text-destructive inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
				>
					{topic}
				</span>
			{/each}
		</div>
	</div>

	<!-- Count -->
	<div class="text-foreground w-10 shrink-0 self-center text-sm font-bold tabular-nums">
		{count}
	</div>

	<!-- Per-group circles -->
	<div class="flex shrink-0 items-center gap-3 self-center pr-4">
		{#each groupPcts as g (g.group_id)}
			<GroupCircle
				label={g.label}
				agreed={g.agreed}
				disagreed={g.disagreed}
				passed={g.passed}
			/>
		{/each}
	</div>
</div>
