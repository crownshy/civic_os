<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronDown } from '@lucide/svelte';
	import FilterToggle from './FilterToggle.svelte';
	import Card from '@civicos/shared/ui/Card.svelte';

	interface Props {
		title: string;
		description: string;
		/** Header label for the per-variant metric column, e.g. "Min Agree". */
		metricLabel: string;
		/** Full row count. When it exceeds what's rendered, show the expander. */
		total?: number;
		/** Rows shown while collapsed (parent does the slicing). */
		collapsedCount?: number;
		/** Bindable expand state — parent slices its list on this. */
		expanded?: boolean;
		excludePasses?: boolean;
		excludeHosts?: boolean;
		onExcludePassesChange?: (next: boolean) => void;
		onExcludeHostsChange?: (next: boolean) => void;
		children: Snippet;
	}

	let {
		title,
		description,
		metricLabel,
		total,
		collapsedCount = 5,
		expanded = $bindable(false),
		excludePasses = $bindable(false),
		excludeHosts = $bindable(true),
		onExcludePassesChange,
		onExcludeHostsChange,
		children
	}: Props = $props();

	const showExpander = $derived(total !== undefined && total > collapsedCount);
</script>

<section class="flex flex-col gap-4">
	<h2 class="font-display text-foreground text-display font-semibold leading-tight">{title}</h2>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-foreground/80 text-section max-w-3xl font-medium">{description}</p>
		<div class="flex items-center gap-2">
			<FilterToggle
				label="Exclude passes"
				bind:checked={excludePasses}
				onchange={onExcludePassesChange}
			/>
			<FilterToggle
				label="Exclude host statements"
				bind:checked={excludeHosts}
				onchange={onExcludeHostsChange}
			/>
		</div>
	</div>

	<Card class="hover:border-muted-foreground/40 shadow-card rounded-[20px] transition-colors duration-200">
		<div class="flex flex-col">
			<div
				class="font-ui text-muted-foreground/60 text-caption grid grid-cols-[2.5rem_minmax(0,1fr)_4rem_5rem_auto] items-center gap-4 px-5 py-3 font-semibold uppercase"
			>
				<div>#</div>
				<div>Statement</div>
				<div>Author</div>
				<div class="text-center">{metricLabel}</div>
				<div class="text-right">Agree %</div>
			</div>
			{@render children()}

			{#if showExpander}
				<button
					type="button"
					onclick={() => (expanded = !expanded)}
					class="bg-muted/40 hover:bg-muted/70 text-foreground/70 flex items-center justify-center gap-2 py-5 text-section font-normal transition-colors"
				>
					{expanded ? 'Show fewer statements' : `See all ${total} statements`}
					<ChevronDown class={`text-destructive size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
				</button>
			{/if}
		</div>
	</Card>
</section>
