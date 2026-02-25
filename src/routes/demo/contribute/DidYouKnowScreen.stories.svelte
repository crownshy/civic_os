<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DidYouKnowScreen from './DidYouKnowScreen.svelte';

	const { Story } = defineMeta({
		title: 'Screens/DidYouKnowScreen',
		component: DidYouKnowScreen,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});
</script>

<Story name="Default" args={{ countyName: 'UTAH COUNTY' }}>
	{#snippet children(args)}
		<DidYouKnowScreen {...args} onContinue={() => {}} />
	{/snippet}
</Story>
