<script lang="ts">
	import type { ReportComment, ReportGroup } from '$lib/types/report';
	import { computeGroupVotePercents, totalVotes } from '$lib/utils/report';
	import { User } from '@lucide/svelte';
	import GroupCircle from './GroupCircle.svelte';
	import RowAccentStripe from './RowAccentStripe.svelte';
	import ThemePicker from './ThemePicker.svelte';

	type Variant = 'consensus' | 'difference' | 'uncertainty' | 'neutral';

	interface Props {
		/** Accepted for call-site convenience; the "#" cell shows the Polis tid. */
		index?: number;
		comment: ReportComment;
		groups: ReportGroup[];
		variant?: Variant;
		/**
		 * Which unit the metric column shows. 'auto' derives it from `variant`
		 * (consensus → agree %, difference → pp, else count). 'count' always shows
		 * the raw vote count regardless of variant — used by the All Statements
		 * table, whose "Count" header must hold for every row while `variant` still
		 * drives the accent stripe colour.
		 */
		metric?: 'auto' | 'count';
		/** Drop passes from the agree% denominator (agrees/(agrees+disagrees)). */
		excludePasses?: boolean;
		picker?: {
			availableThemes: string[];
			onAddTheme: (theme: string) => void | Promise<void>;
			onRemoveTheme: (theme: string) => void | Promise<void>;
			disabled?: boolean;
		};
	}

	let {
		comment,
		groups,
		variant = 'neutral',
		metric = 'auto',
		excludePasses = false,
		picker
	}: Props = $props();

	const groupPcts = $derived(computeGroupVotePercents(comment, groups, { excludePasses }));
	const count = $derived(totalVotes(comment));

	// Per-variant metric shown in its own column (matches the Figma tables):
	//   consensus  → lowest group agree% (MIN AGREE)
	//   difference → max−min group agree% spread (DIFFERENCE, in pp)
	//   otherwise  → total votes (COUNT)
	const agreedPcts = $derived(groupPcts.map((g) => g.agreed));
	const minAgree = $derived(agreedPcts.length ? Math.min(...agreedPcts) : 0);
	const spread = $derived(agreedPcts.length ? Math.max(...agreedPcts) - Math.min(...agreedPcts) : 0);

	const stripeClass = $derived(
		variant === 'consensus'
			? 'bg-consensus'
			: variant === 'difference'
				? 'bg-difference'
				: 'bg-transparent'
	);

	// Seed/host-authored statements (is_seed) label as "You" (the host viewing
	// this admin report authored them). Everyone else is
	// "Participant" — the report payload has no author pid yet, so we can't show
	// the real participant id (e.g. "23"). Backfill is blocked on a backend change
	// (see CONTEXT.md → "Statement author"). Seed author is assumed to be pid 0.
	const isHostAuthored = $derived(!!comment.is_seed);
</script>

<!-- col-span-full + grid-cols-subgrid: the row spans every column of the owning
     grid in StatementSection and adopts its exact tracks, so cells line up with the
     header without this component knowing the column widths. The column-gap is
     inherited from the parent grid's gap-x-4. -->
<div
	class="border-border group hover:bg-muted/40 relative col-span-full grid grid-cols-subgrid items-start border-b py-6 pr-4 pl-5 transition-colors duration-150"
>
	<RowAccentStripe accent={stripeClass} />

	<!-- Polis statement id. Sizes here follow the admin token scale, not the raw
	     Figma px — text-label/body map to the Figma's 12/16px where a token exists;
	     the 18-20px row text has no token so it stays on the scale (see the type
	     discussion). -->
	<div class="font-ui text-muted-foreground text-label pt-1 text-center tabular-nums">
		{comment.tid}
	</div>

	<!-- Statement text + theme tags -->
	<div class="min-w-0">
		<p class="font-ui text-foreground text-lg font-medium leading-6">{comment.text}</p>
		<div class="mt-3">
			{#if picker}
				<ThemePicker
					themes={comment.topics ?? []}
					availableThemes={picker.availableThemes}
					disabled={picker.disabled}
					onAddTheme={picker.onAddTheme}
					onRemoveTheme={picker.onRemoveTheme}
				/>
			{:else}
				<div class="flex flex-wrap items-center gap-1.5">
					{#each comment.topics ?? [] as topic (topic)}
						<span
							class="bg-muted text-foreground/80 text-caption inline-flex items-center rounded px-1.5 py-0.5 font-medium"
						>
							{topic}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Author -->
	<div class="pt-1">
		{#if isHostAuthored}
			<span
				class="text-caption bg-host inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-white"
			>
				<User class="size-3" />You
			</span>
		{:else}
			<span
				class="bg-muted text-muted-foreground text-caption inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium"
			>
				<User class="size-3" />Participant
			</span>
		{/if}
	</div>

	<!-- Metric column. 'count' mode always shows the vote count (e.g. All
	     Statements); 'auto' derives the unit from the variant. -->
	<div class="font-ui pt-1 text-center font-bold">
		{#if metric === 'count'}
			<span class="text-foreground">{count}</span>
		{:else if variant === 'consensus'}
			<span class="text-consensus">{Math.round(minAgree)}%</span>
		{:else if variant === 'difference'}
			<span class="text-difference">{Math.round(spread)}pp</span>
		{:else}
			<span class="text-foreground">{count}</span>
		{/if}
	</div>

	<!-- Per-group agree rings. Arc reflects the toggled agree% (g.agreed); the
	     tooltip uses raw group_votes counts for the honest full breakdown. -->
	<div class="flex items-center gap-3 self-start pt-0.5">
		{#each groupPcts as g (g.group_id)}
			{@const gv = comment.group_votes.find((v) => v.group_id === g.group_id)}
			<GroupCircle
				label={g.label}
				agreePct={g.agreed}
				agrees={gv?.agrees ?? 0}
				disagrees={gv?.disagrees ?? 0}
				passes={gv?.passes ?? 0}
				showLabel={false}
			/>
		{/each}
	</div>
</div>
