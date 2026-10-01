<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import VotingScreen from './VotingScreen.svelte';
	import { REGIONS } from '$lib/config/regions';

	const { Story } = defineMeta({
		title: 'Screens/VotingScreen',
		component: VotingScreen,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});
</script>

<Story
	name="Default"
	args={{
		placeName: 'UTAH COUNTY',
		question: REGIONS.utah.question,
		statementText: 'Social media companies should be held more accountable when they harm someone.',
		remaining: 7,
		total: 10
	}}
>
	{#snippet template(args)}
		<div class="h-dvh">
			<VotingScreen {...args} onVote={() => {}} onEnd={() => {}} onCompose={() => {}} />
		</div>
	{/snippet}
</Story>

<Story
	name="Short Statement"
	args={{
		placeName: 'UTAH COUNTY',
		question: REGIONS.utah.question,
		statementText: 'This is a fairly short opinion.',
		remaining: 10,
		total: 10
	}}
>
	{#snippet template(args)}
		<div class="h-dvh">
			<VotingScreen {...args} onVote={() => {}} onEnd={() => {}} onCompose={() => {}} />
		</div>
	{/snippet}
</Story>

<!-- Both at their TEXT_LIMITS cap (240), the tallest the screen has to fit. -->
<Story
	name="At the Limits"
	args={{
		placeName: 'UTAH COUNTY',
		question:
			'How should our county decide when local government, schools, hospitals and police are allowed to use artificial intelligence, who gets a say in those decisions, and what should happen when an AI system gets something wrong about a resident?',
		statementText:
			'Our county should require any company selling AI tools to local schools to publish what student data they collect, how long they keep it, and who they share it with, and parents should be able to opt their kids out at any time, no question.',
		remaining: 3,
		total: 10
	}}
>
	{#snippet template(args)}
		<div class="h-dvh">
			<VotingScreen {...args} onVote={() => {}} onEnd={() => {}} onCompose={() => {}} />
		</div>
	{/snippet}
</Story>
