<script lang="ts">
	import { Button } from '@civicos/shared/ui/button';
	import { createFixtureSource } from './fixture';
	import { createFixtureGeometrySource } from './geometry-fixture';
	import { PlaceSelectorState } from './place-selector.svelte';
	import PlaceMap from './PlaceMap.svelte';

	type Props = {
		/** Places picked before the story opens. */
		selectedIds?: string[];
		/** Puts the selector where the story wants it: open edit, drill, search. */
		setup?: (selector: PlaceSelectorState) => Promise<void> | void;
		/** Show buttons that move the selector around, to watch the map reframe. */
		controls?: boolean;
	};

	let { selectedIds = [], setup, controls = false }: Props = $props();

	let hoveredId = $state<string | null>(null);

	// Storybook serves the app's static folder, so counties get their real shapes.
	const geometrySource = createFixtureGeometrySource(undefined, { countiesUrl: '/counties' });

	const story = $derived.by(() => {
		const selector = new PlaceSelectorState(createFixtureSource(), selectedIds);
		const prepared = selector.load().then(() => setup?.(selector));
		return { selector, prepared };
	});

	const steps: { label: string; run: (selector: PlaceSelectorState) => unknown }[] = [
		{ label: 'View selection', run: (selector) => selector.closeEdit() },
		{
			label: 'All states',
			run: (selector) => {
				selector.openEdit();
				selector.path = [null];
			}
		},
		{
			label: 'Jefferson County',
			run: (selector) => {
				selector.openEdit();
				return selector.jumpTo('city-4145250');
			}
		},
		{
			label: 'Search "sa"',
			run: (selector) => {
				selector.openEdit();
				return selector.setQuery('sa');
			}
		},
		{ label: 'Toggle Utah', run: (selector) => selector.toggle('state-49') }
	];
</script>

<div class="flex flex-col gap-3">
	{#if controls}
		<div class="flex flex-wrap gap-2">
			{#each steps as step (step.label)}
				<Button variant="outline" size="sm" onclick={() => step.run(story.selector)}>
					{step.label}
				</Button>
			{/each}
			<Button
				variant="outline"
				size="sm"
				onmouseenter={() => (hoveredId = 'county-41017')}
				onmouseleave={() => (hoveredId = null)}
				onfocus={() => (hoveredId = 'county-41017')}
				onblur={() => (hoveredId = null)}
			>
				Hover Deschutes County
			</Button>
		</div>
	{/if}

	<div class="h-[480px]">
		{#await story.prepared}
			<p class="text-body text-muted-foreground">Loading places</p>
		{:then}
			<PlaceMap state={story.selector} {geometrySource} {hoveredId} />
		{/await}
	</div>
</div>
