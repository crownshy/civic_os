<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import MapPlaceholder from './MapPlaceholder.svelte';

	const { Story } = defineMeta({
		title: 'Data Display/MapPlaceholder',
		component: MapPlaceholder,
		tags: ['autodocs']
	});
</script>

<Story name="Default" args={{}}>
	{#snippet children(args)}
		<div class="p-6">
			<MapPlaceholder {...args} />
		</div>
	{/snippet}
</Story>
