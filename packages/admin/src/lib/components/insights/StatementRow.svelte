<script lang="ts">
	import type { ReportComment, ReportGroup } from '$lib/types/report';
	import { computeGroupVotePercents, totalVotes } from '$lib/utils/report';
	import { User } from '@lucide/svelte';
	import GroupCircle from './GroupCircle.svelte';
	import ThemePicker from './ThemePicker.svelte';

	type Variant = 'consensus' | 'difference' | 'uncertainty' | 'neutral';

	interface Props {
		/** Accepted for call-site convenience; the "#" cell shows the Polis tid. */
		index?: number;
		comment: ReportComment;
		groups: ReportGroup[];
		variant?: Variant;
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

<div
	class="border-border group hover:bg-muted/40 relative grid items-start gap-4 border-b py-6 pr-4 pl-5 transition-colors duration-150"
	style="grid-template-columns: var(--insights-cols, 2.5rem minmax(0, 76fr) 14fr 16fr auto)"
>
	<!-- Left accent stripe -->
	<div class={`absolute top-0 bottom-0 left-0 w-1.5 ${stripeClass}`}></div>

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
				class="text-caption inline-flex items-center gap-1 rounded bg-blue-500 px-1.5 py-0.5 font-medium text-white"
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

	<!-- Per-variant metric -->
	<div class="font-ui pt-1 text-center font-bold">
		{#if variant === 'consensus'}
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
