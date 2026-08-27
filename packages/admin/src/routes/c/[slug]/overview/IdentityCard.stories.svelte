<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IdentityCard from './IdentityCard.svelte';

	const { Story } = defineMeta({
		title: 'Setup/IdentityCard',
		component: IdentityCard,
		tags: ['autodocs'],
		args: {
			title: 'AI & Our Communities',
			baseUrl: 'oregon.bloomproject.us',
			slug: 'ai',
			keyQuestion: 'How should Central Oregon manage the changes that are coming with AI?',
			places: ['Oregon']
		}
	});
</script>

<Story name="Default" />

<Story
	name="Multiple places"
	args={{ places: ['Prineville', 'Deschutes County', 'Jefferson County'] }}
/>

<Story name="No places" args={{ places: [] }} />
