<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import { createFixtureSource } from './fixture';
	import { createFixtureGeometrySource } from './geometry-fixture';
	import PlaceSelector from './PlaceSelector.svelte';

	const { Story } = defineMeta({
		title: 'Places/PlaceSelector',
		component: PlaceSelector,
		tags: ['autodocs'],
		parameters: { a11y: { test: 'error' } }
	});

	const source = createFixtureSource();
	// Storybook serves the app's static folder, so counties get their real shapes.
	const geometrySource = createFixtureGeometrySource(undefined, { countiesUrl: '/counties' });
	const mixedSelection = ['state-49', 'county-41017', 'county-41031', 'city-4105800'];
</script>

<!-- The prototype's opening state: Utah, two Oregon counties and Bend. -->
<Story name="Selections" asChild>
	<PlaceSelector {source} {geometrySource} selectedIds={mixedSelection} />
</Story>

<Story name="Nothing selected" asChild>
	<PlaceSelector {source} {geometrySource} />
</Story>

<!-- Edit opens the picker with focus in search. Done returns to the chips and focuses
     Edit, with the new pick added. -->
<Story
	name="View, edit and back"
	asChild
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: 'Edit' }));
		const search = await canvas.findByRole('textbox', { name: 'Search places' });
		await waitFor(() => expect(search).toHaveFocus());

		await userEvent.click(await canvas.findByRole('button', { name: 'California, state' }));
		await userEvent.click(canvas.getByRole('button', { name: 'Done' }));

		const edit = await canvas.findByRole('button', { name: 'Edit' });
		await waitFor(() => expect(edit).toHaveFocus());
		await canvas.findByRole('button', { name: 'Remove California' });
	}}
>
	<PlaceSelector {source} {geometrySource} selectedIds={['state-49']} />
</Story>

<!-- Removing a chip from the keyboard moves focus to the next chip, then to Edit once
     none are left. -->
<Story
	name="Remove with the keyboard"
	asChild
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		(await canvas.findByRole('button', { name: 'Remove Utah' })).focus();
		await userEvent.keyboard('{Enter}');
		const crook = canvas.getByRole('button', { name: 'Remove Crook County' });
		await waitFor(() => expect(crook).toHaveFocus());

		await userEvent.keyboard('{Enter}');
		await waitFor(() => expect(canvas.getByRole('button', { name: 'Edit' })).toHaveFocus());
		await canvas.findByText(/No places selected yet/);
	}}
>
	<PlaceSelector {source} {geometrySource} selectedIds={['state-49', 'county-41013']} />
</Story>

<!-- Below 760px the map stacks under the panel. -->
<Story name="Phone width" asChild>
	<div class="w-[375px]">
		<PlaceSelector {source} {geometrySource} selectedIds={mixedSelection} />
	</div>
</Story>
