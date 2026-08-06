<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ContextCard from './ContextCard.svelte';

	const { Story } = defineMeta({
		title: 'Setup/ContextCard',
		component: ContextCard,
		tags: ['autodocs']
	});
</script>

<Story
	name="Default"
	args={{
		description:
			'Central Oregon is changing fast, and AI is part of that change. This conversation is a chance to share how you think our communities should respond.'
	}}
/>

<Story name="Empty" args={{ description: '' }} />
