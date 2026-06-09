<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import VotingScreen from './VotingScreen.svelte';

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
		countyName: 'UTAH COUNTY',
		question: 'AI & ONLINE SAFETY',
		statementText: 'Social media companies should be held more accountable when they harm someone.',
		remaining: 7,
		total: 10
	}}
>
	{#snippet children(args)}
		<VotingScreen {...args} onVote={() => {}} onEnd={() => {}} onCompose={() => {}} />
	{/snippet}
</Story>

<Story
	name="Short Statement"
	args={{
		countyName: 'UTAH COUNTY',
		question: 'AI & ONLINE SAFETY',
		statementText: 'This is a fairly short opinion.',
		remaining: 10,
		total: 10
	}}
>
	{#snippet children(args)}
		<VotingScreen {...args} onVote={() => {}} onEnd={() => {}} onCompose={() => {}} />
	{/snippet}
</Story>

<Story
	name="Long Statement"
	args={{
		countyName: 'UTAH COUNTY',
		question: 'AI & ONLINE SAFETY',
		statementText:
			"And this is a much longer thing. I figure we want to stick to Polis rules and keep statements a bit shorter, but I also like the idea of giving people a bit more room to say what's on their mind. Still want to keep it easy to consume and prevent ranting, but yeah. And this is a much longer thing.",
		remaining: 3,
		total: 10
	}}
>
	{#snippet children(args)}
		<VotingScreen {...args} onVote={() => {}} onEnd={() => {}} onCompose={() => {}} />
	{/snippet}
</Story>
