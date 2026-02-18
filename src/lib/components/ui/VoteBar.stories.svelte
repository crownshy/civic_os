<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import VoteBar from './VoteBar.svelte';

	const { Story } = defineMeta({
		title: 'UI/VoteBar',
		component: VoteBar,
		tags: ['autodocs'],
		argTypes: {
			current: { control: { type: 'number', min: 0, max: 20 } },
			total: { control: { type: 'number', min: 1, max: 100 } }
		}
	});
</script>

<Story name="With Dots (1/10)" args={{ current: 1, total: 10 }}>
	{#snippet children(args)}
		<VoteBar {...args} />
	{/snippet}
</Story>

<Story name="Progress (5/10)" args={{ current: 5, total: 10 }}>
	{#snippet children(args)}
		<VoteBar {...args} />
	{/snippet}
</Story>

<Story name="Remaining (98 left)" args={{ current: 2, total: 100 }}>
	{#snippet children(args)}
		<VoteBar {...args} />
	{/snippet}
</Story>
