<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
	import AreasPicker from './AreasPicker.svelte';

	const { Story } = defineMeta({
		title: 'Setup/AreasPicker',
		component: AreasPicker,
		tags: ['autodocs'],
		parameters: { a11y: { test: 'error' } },
		args: {
			areas: [
				{ geoid: '41051', level: 'county', name: 'Multnomah County' },
				{ geoid: '4967000', level: 'city', name: 'Salt Lake City' }
			],
			onSave: fn(() => new Promise<void>((resolve) => setTimeout(resolve, 300)))
		}
	});
</script>

<Story name="Saved selection" />

<Story name="Nothing picked yet" args={{ areas: [] }} />

<!-- Removing a chip saves the rest, by GEOID, in the order they were picked. -->
<Story
	name="Saves on change"
	play={async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: 'Remove Multnomah County' }));
		await waitFor(() =>
			expect(args.onSave).toHaveBeenLastCalledWith([
				{ geoid: '4967000', level: 'city', name: 'Salt Lake City' }
			])
		);
		await canvas.findByText('Saved');
	}}
/>

<!-- a11y is a todo here only: the shared `text-destructive` token is 3.59:1 at
     caption size, below AA, and every admin error line uses it. -->
<Story
	name="Save fails"
	parameters={{ a11y: { test: 'todo' } }}
	args={{ onSave: fn(() => Promise.reject(new Error('Network down'))) }}
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: 'Remove Salt Lake City' }));
		await canvas.findByText(/Couldn't save: Network down/);
	}}
/>
