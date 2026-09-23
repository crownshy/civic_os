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
			'Central Oregon is changing fast, and AI is part of that change. This conversation is a chance to share how you think our communities should respond.',
		thankYouMessage:
			'When this Open Poll closes we will publish the results, and the themes people agreed on become the agenda for the live conversations in the spring.'
	}}
/>

<!-- A Campaign that has never saved a thank-you message: the field is nullable,
	so this is what Setup renders before the first save. -->
<Story
	name="No ending message"
	args={{
		description:
			'Central Oregon is changing fast, and AI is part of that change. This conversation is a chance to share how you think our communities should respond.',
		thankYouMessage: ''
	}}
/>

<Story name="Empty" args={{ description: '', thankYouMessage: '' }} />
