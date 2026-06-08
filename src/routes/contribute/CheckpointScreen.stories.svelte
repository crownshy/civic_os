<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CheckpointScreen from './CheckpointScreen.svelte';
	import { REGIONS } from '$lib/config/regions';

	const { Story } = defineMeta({
		title: 'Screens/CheckpointScreen',
		component: CheckpointScreen,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});

	const baseArgs = {
		countyName: 'UTAH COUNTY',
		region: REGIONS.utah,
		remaining: 25,
		onPrimary: () => {},
		onKeepGoing: () => {},
		onEnd: () => {}
	};
</script>

<Story name="Contribute (vote 10)" args={{ ...baseArgs, variant: 'contribute' }}>
	{#snippet children(args)}
		<CheckpointScreen {...args} />
	{/snippet}
</Story>

<Story name="Email (vote 20)" args={{ ...baseArgs, variant: 'email' }}>
	{#snippet children(args)}
		<CheckpointScreen {...args} />
	{/snippet}
</Story>

<Story name="Feedback (vote 30)" args={{ ...baseArgs, variant: 'feedback' }}>
	{#snippet children(args)}
		<CheckpointScreen {...args} />
	{/snippet}
</Story>

<Story name="Share (vote 40)" args={{ ...baseArgs, variant: 'share' }}>
	{#snippet children(args)}
		<CheckpointScreen {...args} />
	{/snippet}
</Story>
