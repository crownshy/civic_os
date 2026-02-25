<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import VoteBar from './VoteBar.svelte';

	const { Story } = defineMeta({
		title: 'Composites/VoteBar',
		component: VoteBar,
		tags: ['autodocs'],
		argTypes: {
			current: { control: { type: 'range', min: 0, max: 20 } },
			total: { control: { type: 'range', min: 1, max: 20 } }
		}
	});
</script>

<Story name="Start" args={{ current: 0, total: 10 }}>
	{#snippet children(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Midway" args={{ current: 5, total: 10 }}>
	{#snippet children(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Almost Done" args={{ current: 9, total: 10 }}>
	{#snippet children(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Complete" args={{ current: 10, total: 10 }}>
	{#snippet children(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>
