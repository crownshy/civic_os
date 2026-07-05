<script lang="ts">
	import type { ReportComment, ReportGroup } from '$lib/types/report';
	import type { ModerationStatus } from '$lib/types/aux';
	import { computeGroupVotePercents, totalVotes } from '$lib/utils/report';
	import { Check, X, User } from '@lucide/svelte';
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
		/** Kept for API compatibility; the metric column replaces the old pill. */
		showVerdictPill?: boolean;
		picker?: {
			availableThemes: string[];
			onAddTheme: (theme: string) => void | Promise<void>;
			onRemoveTheme: (theme: string) => void | Promise<void>;
			disabled?: boolean;
		};
		moderation?: {
			status: ModerationStatus | null;
			pending?: boolean;
			disabled?: boolean;
			onAccept: () => void | Promise<void>;
			onReject: () => void | Promise<void>;
		};
	}

	let {
		comment,
		groups,
		variant = 'neutral',
		excludePasses = false,
		picker,
		moderation
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

	// author == 0 (the host / seed author) renders as "You". Other participants'
	// ids aren't in the report payload yet — placeholder badge until backfilled.
	const isYou = $derived(!!comment.is_seed);
</script>

<div
	class="border-border group hover:bg-muted/40 relative grid grid-cols-[2.5rem_minmax(0,1fr)_4rem_5rem_auto] items-start gap-4 border-b py-6 pr-4 pl-5 transition-colors duration-150"
>
	<!-- Left accent stripe -->
	<div class={`absolute top-0 bottom-0 left-0 w-1.5 ${stripeClass}`}></div>

	<!-- Polis statement id -->
	<div class="font-ui text-muted-foreground text-caption pt-1 text-center tabular-nums">
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
		{#if isYou}
			<span
				class="text-caption inline-flex items-center gap-1 rounded bg-blue-500 px-1.5 py-0.5 font-medium text-white"
			>
				<User class="size-3" />You
			</span>
		{:else}
			<span
				class="bg-muted text-muted-foreground text-caption inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium"
			>
				<User class="size-3" />
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

	<!-- Per-group agree rings + hover-revealed moderation -->
	<div class="flex items-center gap-3 self-start pt-0.5">
		{#each groupPcts as g (g.group_id)}
			<GroupCircle agreed={g.agreed} disagreed={g.disagreed} passed={g.passed} showLabel={false} />
		{/each}
		{#if moderation}
			<div
				class="ml-1 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
			>
				<button
					type="button"
					disabled={moderation.disabled || moderation.pending || moderation.status === 'accepted'}
					onclick={() => moderation?.onAccept()}
					title="Accept"
					class="text-primary hover:bg-primary/15 inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-all duration-150 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-transparent"
				>
					<Check class="size-4" />
				</button>
				<button
					type="button"
					disabled={moderation.disabled || moderation.pending || moderation.status === 'rejected'}
					onclick={() => moderation?.onReject()}
					title="Reject"
					class="text-destructive hover:bg-destructive/15 inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-all duration-150 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-transparent"
				>
					<X class="size-4" />
				</button>
			</div>
		{/if}
	</div>
</div>
