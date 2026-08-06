<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DemographicsCard from './DemographicsCard.svelte';

	const { Story } = defineMeta({
		title: 'Setup/DemographicsCard',
		component: DemographicsCard,
		tags: ['autodocs']
	});
</script>

<!-- Uses the component's built-in default categories. -->
<Story name="Default categories" />

<Story
	name="With a custom category"
	args={{
		categories: [
			{ name: 'Age', options: ['Under 18', '18-24', '25-34', '35+'], enabled: true },
			{
				name: 'Education Level',
				options: ['Below High School', 'High School / GED', 'College Graduate', 'Masters or Above'],
				enabled: true
			}
		]
	}}
/>
