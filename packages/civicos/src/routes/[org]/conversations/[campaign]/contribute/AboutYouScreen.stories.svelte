<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AboutYouScreen from './AboutYouScreen.svelte';
	import { REGIONS } from '$lib/config/regions';
	import { DEFAULT_TOGGLES, aboutYouQuestionsFor } from '$lib/config/participation';

	const { Story } = defineMeta({
		title: 'Screens/AboutYouScreen',
		component: AboutYouScreen,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});

	// The same call the route makes, so these stories track admin's categories
	// rather than a fixture that drifts from them.
	const allCategories = aboutYouQuestionsFor(DEFAULT_TOGGLES);
	const twoCategories = aboutYouQuestionsFor({
		...DEFAULT_TOGGLES,
		gender: false,
		politicalParty: false
	});
</script>

<Story name="Every category on" args={{ countyName: 'UTAH COUNTY', questions: allCategories }}>
	{#snippet template(args)}
		<AboutYouScreen {...args} region={REGIONS.utah} onDone={() => {}} />
	{/snippet}
</Story>

<Story
	name="Gender and party switched off"
	args={{ countyName: 'UTAH COUNTY', questions: twoCategories }}
>
	{#snippet template(args)}
		<AboutYouScreen {...args} region={REGIONS.utah} onDone={() => {}} />
	{/snippet}
</Story>
