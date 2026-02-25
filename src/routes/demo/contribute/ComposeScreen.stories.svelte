<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ComposeScreen from './ComposeScreen.svelte';

	const { Story } = defineMeta({
		title: 'Screens/ComposeScreen',
		component: ComposeScreen,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});
</script>

<Story name="Default" args={{
	question: 'What should we do to make sure social media helps us, not hurts us?',
	countyName: 'UTAH COUNTY'
}}>
	{#snippet children(args)}
		<ComposeScreen {...args} onSubmit={() => {}} onBack={() => {}} />
	{/snippet}
</Story>
