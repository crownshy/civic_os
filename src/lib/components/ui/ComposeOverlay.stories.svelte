<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ComposeOverlay from './ComposeOverlay.svelte';

	const { Story } = defineMeta({
		title: 'UI/ComposeOverlay',
		component: ComposeOverlay,
		tags: ['autodocs']
	});
</script>

<Story name="Empty" args={{ question: 'WHAT SHOULD WE DO TO MAKE SURE SOCIAL MEDIA IS HEALTHY FOR TEENS?', countyName: 'ABC COUNTY' }}>
	{#snippet children(args)}
		<ComposeOverlay {...args} />
	{/snippet}
</Story>
