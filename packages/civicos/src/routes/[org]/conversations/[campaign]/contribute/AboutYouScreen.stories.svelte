<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AboutYouScreen from './AboutYouScreen.svelte';
	import {
		DEFAULT_TOGGLES,
		aboutYouQuestionsFor,
		aboutYouQuestionsFromBackend
	} from '$lib/config/participation';
	import { DEFAULT_DEMOGRAPHIC_QUESTIONS } from '@civicos/shared/data/demographics';

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
	// Age plus a category the Host wrote in admin.
	const withCustom = aboutYouQuestionsFromBackend([
		DEFAULT_DEMOGRAPHIC_QUESTIONS[0],
		{
			slug: 'housing',
			displayName: 'Housing',
			bucketConfig: {
				type: 'string',
				options: [
					{ value: 'rent', label: 'I rent' },
					{ value: 'own', label: 'I own' },
					{ value: 'other', label: 'Something else' }
				]
			}
		}
	]);
</script>

<Story name="Every category on" args={{ placeName: 'UTAH COUNTY', questions: allCategories }}>
	{#snippet template(args)}
		<AboutYouScreen {...args} onDone={() => {}} />
	{/snippet}
</Story>

<Story
	name="Gender and party switched off"
	args={{ placeName: 'UTAH COUNTY', questions: twoCategories }}
>
	{#snippet template(args)}
		<AboutYouScreen {...args} onDone={() => {}} />
	{/snippet}
</Story>

<Story name="With a Host's own category" args={{ placeName: 'UTAH COUNTY', questions: withCustom }}>
	{#snippet template(args)}
		<AboutYouScreen {...args} onDone={() => {}} />
	{/snippet}
</Story>
