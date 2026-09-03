<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import VoteBar from './VoteBar.svelte';

	const { Story } = defineMeta({
		title: 'Composites/VoteBar',
		component: VoteBar,
		tags: ['autodocs'],
		argTypes: {
			disabled: { control: 'boolean' },
			skeleton: { control: 'boolean' }
		}
	});
</script>

<Story name="Default" args={{}}>
	{#snippet template(args)}
		<div class="bg-card">
			<VoteBar {...args} onAgree={() => {}} onDisagree={() => {}} onSkip={() => {}} />
		</div>
	{/snippet}
</Story>

<!-- The report link only renders when a handler is given, so it is its own story. -->
<Story name="With Report Link" args={{}}>
	{#snippet template(args)}
		<div class="bg-card">
			<VoteBar
				{...args}
				onAgree={() => {}}
				onDisagree={() => {}}
				onSkip={() => {}}
				onReport={() => {}}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true }}>
	{#snippet template(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Skeleton" args={{ skeleton: true }}>
	{#snippet template(args)}
		<div class="bg-card">
			<VoteBar {...args} />
		</div>
	{/snippet}
</Story>
