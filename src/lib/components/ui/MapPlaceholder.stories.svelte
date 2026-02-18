<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import MapPlaceholder from './MapPlaceholder.svelte';

	const { Story } = defineMeta({
		title: 'UI/MapPlaceholder',
		component: MapPlaceholder,
		tags: ['autodocs']
	});
</script>

<Story name="Default">
	{#snippet children(args)}
		<MapPlaceholder {...args} />
	{/snippet}
</Story>
