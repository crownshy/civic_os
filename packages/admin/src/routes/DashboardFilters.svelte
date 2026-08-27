<script lang="ts">
	import { ArrowDownAZ, Search, X } from '@lucide/svelte';
	import { Input } from '@civicos/shared/ui/input';
	import { ToggleGroup, ToggleGroupItem } from '@civicos/shared/ui/toggle-group';
	import type { ConversationStatus } from '$lib/conversations';

	type StatusFilter = ConversationStatus | 'all';

	interface Props {
		search: string;
		status: StatusFilter;
		alphabetical: boolean;
		/** How many Campaigns each badge would leave on screen. */
		counts: Record<StatusFilter, number>;
	}

	let {
		search = $bindable(),
		status = $bindable(),
		alphabetical = $bindable(),
		counts
	}: Props = $props();

	const filters: { value: StatusFilter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'live', label: 'Live' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'complete', label: 'Closed' }
	];
</script>

<div class="mb-6 flex flex-wrap items-center gap-3">
	<div class="relative w-full sm:max-w-xs">
		<Search
			class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			type="search"
			bind:value={search}
			placeholder="Search by name"
			aria-label="Search Campaigns by name"
			class="h-9 pl-8 {search ? 'pr-8' : ''}"
		/>
		{#if search}
			<button
				type="button"
				onclick={() => (search = '')}
				aria-label="Clear search"
				class="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
			>
				<X class="size-4" />
			</button>
		{/if}
	</div>

	<!-- bits-ui lets a single toggle-group deselect back to ''; the dashboard
	     always has one status in effect, so an empty write is dropped. -->
	<ToggleGroup
		type="single"
		bind:value={() => status, (next) => (status = (next as StatusFilter) || status)}
		aria-label="Filter Campaigns by status"
	>
		{#each filters as filter (filter.value)}
			<ToggleGroupItem value={filter.value} class="px-3 py-1.5">
				{filter.label}
				<span class="text-muted-foreground tabular-nums">{counts[filter.value]}</span>
			</ToggleGroupItem>
		{/each}
	</ToggleGroup>

	<ToggleGroup
		type="single"
		bind:value={() => (alphabetical ? 'az' : ''), (next) => (alphabetical = next === 'az')}
		aria-label="Sort Campaigns"
		class="ml-auto"
	>
		<ToggleGroupItem value="az" class="px-3 py-1.5">
			<ArrowDownAZ />
			A to Z
		</ToggleGroupItem>
	</ToggleGroup>
</div>
