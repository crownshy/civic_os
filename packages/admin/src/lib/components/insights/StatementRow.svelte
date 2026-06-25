<script lang="ts">
	import type { ReportComment, ReportGroup } from '$lib/types/report';
	import type { ModerationStatus } from '$lib/types/aux';
	import { computeGroupVotePercents, totalVotes } from '$lib/utils/report';
	import { Check, X } from '@lucide/svelte';
	import GroupCircle from './GroupCircle.svelte';
	import ThemePicker from './ThemePicker.svelte';

	type Variant = 'consensus' | 'difference' | 'uncertainty' | 'neutral';

	interface Props {
		index: number;
		comment: ReportComment;
		groups: ReportGroup[];
		variant?: Variant;
		/** Show the "consensus" / "difference" pill on the left of the text. */
		showVerdictPill?: boolean;
		/**
		 * When provided, render the inline ThemePicker (Insights' Theme
		 * Explorer rows). When omitted, render small read-only theme chips
		 * (Areas of Consensus / Difference / Uncertainty rows).
		 */
		picker?: {
			availableThemes: string[];
			onAddTheme: (theme: string) => void | Promise<void>;
			onRemoveTheme: (theme: string) => void | Promise<void>;
			/** Disable when there's no aux row to write to. */
			disabled?: boolean;
		};
		/**
		 * When provided, render accept/reject buttons that forward the
		 * decision to Polis via the moderate endpoint. Omit (or pass
		 * `disabled: true`) on rows without an aux row to write to.
		 */
		moderation?: {
			status: ModerationStatus | null;
			pending?: boolean;
			disabled?: boolean;
			onAccept: () => void | Promise<void>;
			onReject: () => void | Promise<void>;
		};
	}

	let {
		index,
		comment,
		groups,
		variant = 'neutral',
		showVerdictPill = false,
		picker,
		moderation
	}: Props = $props();

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

<div
	class="border-border group hover:bg-muted/40 relative grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(10rem,14rem)_2.5rem_auto_auto] items-start gap-4 border-b py-4 pl-4 transition-colors duration-150"
>
	<!-- Left accent bar -->
	<div
		class={`absolute top-0 bottom-0 left-0 w-1.5 transition-all duration-150 group-hover:w-2 ${accentClass}`}
	></div>

	<!-- Index -->
	<div class="text-muted-foreground pt-0.5 text-center text-caption">
		{index}
	</div>

	<!-- Statement text + verdict pill -->
	<div class="min-w-0">
		<p class="text-foreground text-body leading-5">{comment.text}</p>
		{#if showVerdictPill && verdictPill}
			<span
				class={`mt-2 inline-flex items-center rounded px-1.5 py-0.5 text-caption font-medium ${verdictPill.class}`}
			>
				{verdictPill.label}
			</span>
		{/if}
	</div>

	<!-- Theme column: picker for editable rows, read-only chips otherwise -->
	<div class="min-w-0 pt-0.5">
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
						class="bg-muted text-foreground/80 inline-flex items-center rounded px-1.5 py-0.5 text-caption font-medium"
					>
						{topic}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Count -->
	<div class="text-foreground self-center text-body font-bold tabular-nums">
		{count}
	</div>

	<!-- Per-group circles -->
	<div class="flex items-center gap-3 self-center">
		{#each groupPcts as g (g.group_id)}
			<GroupCircle
				label={g.label}
				agreed={g.agreed}
				disagreed={g.disagreed}
				passed={g.passed}
			/>
		{/each}
	</div>

	<!-- Accept / reject (moderation) -->
	<div class="flex items-center gap-1 self-center pr-4">
		{#if moderation}
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
		{/if}
	</div>
</div>
