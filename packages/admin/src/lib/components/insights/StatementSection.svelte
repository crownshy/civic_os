<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronDown } from '@lucide/svelte';
	import ColumnFilterHeader from './ColumnFilterHeader.svelte';
	import Card from '@civicos/shared/ui/Card.svelte';

	interface Props {
		/** Optional id on the root section (scroll anchor for deep-links). */
		id?: string;
		title: string;
		/** Trailing description text after the "N STATEMENTS" count, e.g. "with greater than 80%…". */
		description: string;
		/** Count shown as the coloured "N STATEMENTS" lead-in (main + low-quality). */
		count?: number;
		/** Accent colour for the count lead-in. */
		countAccent?: 'consensus' | 'difference' | 'all';
		/** Header label for the per-variant metric column, e.g. "Min Agree". */
		metricLabel: string;
		/** Full main-list count. When it exceeds what's rendered, show the expander. */
		total?: number;
		/** Rows shown while collapsed (parent does the slicing). */
		collapsedCount?: number;
		/** Bindable expand state — parent slices its list on this. */
		expanded?: boolean;
		/** How many low-quality rows are hidden. 0 → no low-quality reveal. */
		lowQualityCount?: number;
		/** Bindable — reveal the low-quality rows. */
		showLowQuality?: boolean;
		excludePasses?: boolean;
		excludeHosts?: boolean;
		onExcludePassesChange?: (next: boolean) => void;
		onExcludeHostsChange?: (next: boolean) => void;
		children: Snippet;
		/** Optional controls rendered between the description and the table (e.g. theme chips). */
		toolbar?: Snippet;
		/** Low-quality rows, rendered below the reveal toggle when expanded. */
		lowQuality?: Snippet;
	}

	let {
		id,
		title,
		description,
		count,
		countAccent = 'all',
		metricLabel,
		total,
		collapsedCount = 5,
		expanded = $bindable(false),
		lowQualityCount = 0,
		showLowQuality = $bindable(false),
		excludePasses = $bindable(false),
		excludeHosts = $bindable(true),
		onExcludePassesChange,
		onExcludeHostsChange,
		children,
		toolbar,
		lowQuality
	}: Props = $props();

	const showExpander = $derived(total !== undefined && total > collapsedCount);

	const countAccentClass = $derived(
		countAccent === 'consensus'
			? 'text-consensus'
			: countAccent === 'difference'
				? 'text-difference'
				: 'text-destructive'
	);
</script>

<section {id} class="scroll-mt-4 flex flex-col gap-4">
	<h2 class="font-display text-foreground text-display font-semibold leading-tight">{title}</h2>
	<p class="font-display text-foreground text-section font-medium whitespace-nowrap">
		{#if count !== undefined}<span class={countAccentClass}>{count} STATEMENTS</span>&nbsp;{/if}{description}
	</p>

	{#if toolbar}
		{@render toolbar()}
	{/if}

	<!-- overflow-visible (overrides Card's default overflow-hidden) so the sticky
	     header can pin to the layout scroll container instead of being clipped. -->
	<Card
		class="hover:border-muted-foreground/40 shadow-card overflow-visible rounded-[20px] transition-colors duration-200"
	>
		<div class="flex flex-col [&>*:last-child]:rounded-b-[20px]">
			<div
				class="bg-card font-ui text-muted-foreground/60 text-caption sticky top-0 z-10 grid grid-cols-[2.5rem_minmax(0,1fr)_4rem_5rem_auto] items-center gap-4 rounded-t-[20px] px-5 py-3 font-semibold uppercase"
			>
				<div>#</div>
				<div>Statement</div>
				<ColumnFilterHeader
					label="Author"
					optionLabel="Include host statements"
					checked={!excludeHosts}
					onchange={(included) => {
						excludeHosts = !included;
						onExcludeHostsChange?.(excludeHosts);
					}}
				/>
				<div class="text-center">{metricLabel}</div>
				<ColumnFilterHeader
					label="Agree %"
					optionLabel="Include passes"
					align="right"
					checked={!excludePasses}
					onchange={(included) => {
						excludePasses = !included;
						onExcludePassesChange?.(excludePasses);
					}}
				/>
			</div>

			{@render children()}

			{#if showExpander}
				<button
					type="button"
					onclick={() => (expanded = !expanded)}
					class="bg-muted/40 hover:bg-muted/70 text-foreground/70 text-section flex items-center justify-center gap-2 py-5 font-normal transition-colors"
				>
					{expanded ? 'Show fewer statements' : `See all ${total} statements`}
					<ChevronDown
						class={`text-destructive size-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
					/>
				</button>
			{/if}

			{#if lowQualityCount > 0}
				<button
					type="button"
					onclick={() => (showLowQuality = !showLowQuality)}
					class="text-section flex items-center justify-center gap-2 bg-yellow-400/5 py-5 text-yellow-600 transition-colors hover:bg-yellow-400/10"
				>
					{showLowQuality
						? 'Hide low data quality statements'
						: `See ${lowQualityCount} statement${lowQualityCount === 1 ? '' : 's'} with low data quality`}
					<ChevronDown
						class={`size-4 transition-transform ${showLowQuality ? 'rotate-180' : ''}`}
					/>
				</button>
				{#if showLowQuality && lowQuality}
					{@render lowQuality()}
				{/if}
			{/if}
		</div>
	</Card>
</section>
