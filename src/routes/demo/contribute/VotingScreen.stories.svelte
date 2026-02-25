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

	const statement = {
		id: 'stmt-001',
		text: 'Social media companies should be held more accountable when they harm someone.',
		authorAlias: 'Bold Beaver',
		authorColor: '#2952C0',
		deliberationId: 'delib-001',
		postedAt: 'Jan 05 2026'
	};

	const shortStatement = {
		id: 'stmt-002',
		text: 'This is a fairly short opinion.',
		authorAlias: 'Astute Albatross',
		authorColor: '#FC3AA8',
		deliberationId: 'delib-001',
		postedAt: 'Jan 02 2026'
	};

	const longStatement = {
		id: 'stmt-003',
		text: "And this is a much longer thing. I figure we want to stick to Polis rules and keep statements a bit shorter, but I also like the idea of giving people a bit more room to say what's on their mind. Still want to keep it easy to consume and prevent ranting, but yeah. And this is a much longer thing.",
		authorAlias: 'Clandestine Coral',
		authorColor: '#2DD4BF',
		deliberationId: 'delib-001',
		postedAt: 'Jan 04 2026'
	};
</script>

<Story name="Default" args={{
	countyName: 'UTAH COUNTY',
	question: 'AI & ONLINE SAFETY',
	statement,
	totalVotes: 3,
	totalStatements: 10,
	currentIndex: 3
}}>
	{#snippet children(args)}
		<VotingScreen {...args} onVote={() => {}} onEnd={() => {}} onCompose={() => {}} />
	{/snippet}
</Story>

<Story name="Short Statement" args={{
	countyName: 'UTAH COUNTY',
	question: 'AI & ONLINE SAFETY',
	statement: shortStatement,
	totalVotes: 0,
	totalStatements: 10,
	currentIndex: 0
}}>
	{#snippet children(args)}
		<VotingScreen {...args} onVote={() => {}} onEnd={() => {}} onCompose={() => {}} />
	{/snippet}
</Story>

<Story name="Long Statement" args={{
	countyName: 'UTAH COUNTY',
	question: 'AI & ONLINE SAFETY',
	statement: longStatement,
	totalVotes: 7,
	totalStatements: 10,
	currentIndex: 7
}}>
	{#snippet children(args)}
		<VotingScreen {...args} onVote={() => {}} onEnd={() => {}} onCompose={() => {}} />
	{/snippet}
</Story>
