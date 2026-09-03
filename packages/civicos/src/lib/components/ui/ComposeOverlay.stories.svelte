<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ComposeOverlay from './ComposeOverlay.svelte';

	const { Story } = defineMeta({
		title: 'Composites/ComposeOverlay',
		component: ComposeOverlay,
		tags: ['autodocs'],
		argTypes: {
			question: { control: 'text' },
			placeName: { control: 'text' }
		},
		parameters: {
			layout: 'fullscreen'
		}
	});
</script>

<Story
	name="Default"
	args={{
		question: 'What should we do to make sure social media helps us, not hurts us?',
		placeName: 'UTAH COUNTY'
	}}
>
	{#snippet template(args)}
		<ComposeOverlay {...args} />
	{/snippet}
</Story>
