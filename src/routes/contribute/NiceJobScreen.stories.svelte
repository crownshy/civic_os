<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NiceJobScreen from './NiceJobScreen.svelte';

	const { Story } = defineMeta({
		title: 'Screens/NiceJobScreen',
		component: NiceJobScreen,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});
</script>

<Story name="Default" args={{ countyName: 'UTAH COUNTY' }}>
	{#snippet children(args)}
		<NiceJobScreen {...args} onKeepVoting={() => {}} onDone={() => {}} />
	{/snippet}
</Story>
