<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PollStatRow from './PollStatRow.svelte';

	const { Story } = defineMeta({
		title: 'Components/PollStatRow',
		component: PollStatRow,
		tags: ['autodocs']
	});
</script>

<Story
	name="Default"
	args={{
		stats: [
			{ label: 'Total Statements', value: 57 },
			{ label: 'Themes', value: 8 },
			{ label: 'Consensus', value: '42%' }
		]
	}}
/>

<Story
	name="With accent and action"
	args={{
		stats: [
			{ label: 'Participants', value: 340, accent: ' (+26)' },
			{ label: 'Votes', value: '3,242' },
			{ label: 'Statements', value: 57, action: { label: 'VIEW', onclick: () => {} } }
		]
	}}
/>
