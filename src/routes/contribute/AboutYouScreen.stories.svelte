<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AboutYouScreen from './AboutYouScreen.svelte';

	const { Story } = defineMeta({
		title: 'Screens/AboutYouScreen',
		component: AboutYouScreen,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});

	const questions = [
		{
			id: 'about-001',
			question: 'What is your age?',
			description:
				'This information helps us make sure everyone is represented in the conversation. You can revoke access to this at any time.',
			options: ['Under 18', '18 - 24', '25-39', '40-64', '65 and older'],
			multiSelect: false
		},
		{
			id: 'about-002',
			question: 'Which of the following ethnicities do you identify with?',
			description:
				'This information helps us make sure everyone is represented in the conversation. You can revoke access to this at any time.',
			options: ['Asian', 'Black', 'White', 'Hispanic', 'Other'],
			multiSelect: true
		}
	];
</script>

<Story name="Age Question" args={{ countyName: 'UTAH COUNTY', questions }}>
	{#snippet children(args)}
		<AboutYouScreen {...args} onDone={() => {}} />
	{/snippet}
</Story>
