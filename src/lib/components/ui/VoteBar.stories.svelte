<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import VoteBar from './VoteBar.svelte';

	const { Story } = defineMeta({
		title: 'Composites/VoteBar',
		component: VoteBar,
		tags: ['autodocs'],
		argTypes: {
			remaining: { control: { type: 'range', min: 0, max: 20 } },
			total: { control: { type: 'range', min: 1, max: 20 } }
		}
	});
</script>

<Story name="Start" args={{ remaining: 10, total: 10 }}>
	{#snippet children(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Midway" args={{ remaining: 5, total: 10 }}>
	{#snippet children(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Almost Done" args={{ remaining: 1, total: 10 }}>
	{#snippet children(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Complete" args={{ remaining: 0, total: 10 }}>
	{#snippet children(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>
