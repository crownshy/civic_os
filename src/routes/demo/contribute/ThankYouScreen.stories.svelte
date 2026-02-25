<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThankYouScreen from './ThankYouScreen.svelte';

	const { Story } = defineMeta({
		title: 'Screens/ThankYouScreen',
		component: ThankYouScreen,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});
</script>

<Story name="Default" args={{ countyName: 'UTAH COUNTY' }}>
	{#snippet children(args)}
		<ThankYouScreen {...args} onContinue={() => {}} onGoHome={() => {}} />
	{/snippet}
</Story>
