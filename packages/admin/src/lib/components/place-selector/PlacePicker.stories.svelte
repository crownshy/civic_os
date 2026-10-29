<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import { cn } from '@civicos/shared/utils';
	import PlacePicker from './PlacePicker.svelte';
	import { PlaceSelectorState } from './place-selector.svelte';
	import { createFixtureSource } from './fixture';

	const { Story } = defineMeta({
		title: 'Places/PlacePicker',
		component: PlacePicker,
		tags: ['autodocs'],
		parameters: { a11y: { test: 'error' } }
	});

	type Setup = { selected?: string[]; path?: string[]; query?: string };

	async function prepare({ selected = [], path = [], query = '' }: Setup) {
		const selector = new PlaceSelectorState(createFixtureSource(), selected);
		selector.openEdit();
		await selector.load();
		for (const id of path) await selector.drill(id);
		if (query) await selector.setQuery(query);
		return selector;
	}

	/** Builds the state without waiting, so the picker renders while the source is slow. */
	function prepareLoading(): PlaceSelectorState {
		const selector = new PlaceSelectorState(createFixtureSource(undefined, { delayMs: 600_000 }));
		selector.openEdit();
		void selector.load();
		return selector;
	}
</script>

{#snippet frame(selector: PlaceSelectorState | Promise<PlaceSelectorState>, dark = false)}
	<div
		class={cn(
			'h-[560px] w-[400px] overflow-hidden rounded-xl border border-border bg-card',
			dark && 'dark'
		)}
	>
		{#await selector then ready}
			<PlacePicker state={ready} ondone={() => {}} />
		{/await}
	</div>
{/snippet}

<!-- The top level: every state, nothing picked yet. -->
<Story name="Browsing" asChild>
	{@render frame(prepare({}))}
</Story>

<!-- Jefferson County is picked, so its cities read "Included with Jefferson County"
     but stay unselected. Madras is picked too, which is allowed. -->
<Story name="Covered by a selected county" asChild>
	{@render frame(
		prepare({
			selected: ['county-41031', 'city-4145250'],
			path: ['state-41', 'county-41031']
		})
	)}
</Story>

<!-- Oregon's counties, with Deschutes and Jefferson picked. -->
<Story name="Selected counties" asChild>
	{@render frame(prepare({ selected: ['county-41017', 'county-41031'], path: ['state-41'] }))}
</Story>

<!-- Prefix search across levels: counties before cities, each with where it is. -->
<Story name="Search results" asChild>
	{@render frame(prepare({ selected: ['county-49035', 'city-4967440'], query: 'sa' }))}
</Story>

<Story name="Empty search" asChild>
	{@render frame(prepare({ query: 'zzz' }))}
</Story>

<!-- Toggling a row, then drilling and backing out from the keyboard: focus moves to
     Back, then returns to the arrow it came from. -->
<Story
	name="Select and drill with the keyboard"
	asChild
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const oregon = await canvas.findByRole('button', { name: 'Oregon, state' });
		await userEvent.click(oregon);
		await expect(oregon).toHaveAttribute('aria-pressed', 'true');

		const showCounties = canvas.getByRole('button', { name: 'Show counties in Oregon' });
		showCounties.focus();
		await userEvent.keyboard('{Enter}');
		await canvas.findAllByText('Included with Oregon');
		const back = await canvas.findByRole('button', { name: 'Back to all states' });
		await waitFor(() => expect(back).toHaveFocus());

		await userEvent.keyboard('{Enter}');
		await waitFor(() =>
			expect(canvas.getByRole('button', { name: 'Show counties in Oregon' })).toHaveFocus()
		);
	}}
>
	{@render frame(prepare({}))}
</Story>

<!-- The arrow on a search result opens that level and clears the search. -->
<Story
	name="Open a level from search"
	asChild
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			await canvas.findByRole('button', { name: 'Show cities and towns in Salt Lake County' })
		);
		const back = await canvas.findByRole('button', { name: 'Back to Utah' });
		await waitFor(() => expect(back).toHaveFocus());
		await expect(canvas.getByRole('textbox', { name: 'Search places' })).toHaveValue('');
		await canvas.findByRole('button', { name: 'Sandy, city' });
	}}
>
	{@render frame(prepare({ query: 'sa' }))}
</Story>

<Story name="Loading" asChild>
	{@render frame(prepareLoading())}
</Story>

<Story name="Covered (dark)" asChild>
	{@render frame(
		prepare({
			selected: ['county-41031', 'city-4145250'],
			path: ['state-41', 'county-41031']
		}),
		true
	)}
</Story>

<Story name="Search results (dark)" asChild>
	{@render frame(prepare({ selected: ['county-49035', 'city-4967440'], query: 'sa' }), true)}
</Story>
