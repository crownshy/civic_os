<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SetupCard from './SetupCard.svelte';

	const { Story } = defineMeta({
		title: 'Setup/SetupCard',
		component: SetupCard,
		tags: ['autodocs']
	});
</script>

<Story
	name="With subtitle"
	args={{
		title: 'Co-Hosts',
		subtitle: 'The organizations who are stewarding this conversation in your community.'
	}}
>
	{#snippet template(args)}
		<SetupCard title={args.title} subtitle={args.subtitle}>
			<div class="text-body">Card body content goes here.</div>
		</SetupCard>
	{/snippet}
</Story>

<Story name="Title only" args={{ title: 'Demographics' }}>
	{#snippet template(args)}
		<SetupCard title={args.title}>
			<div class="text-body">Card body content goes here.</div>
		</SetupCard>
	{/snippet}
</Story>

<Story
	name="With header action"
	args={{ title: 'Open Poll', subtitle: 'at oregon.bloomproject.us/ai/poll' }}
>
	{#snippet template(args)}
		<SetupCard title={args.title} subtitle={args.subtitle}>
			{#snippet action()}
				<span class="bg-success px-2 py-0.5 text-body font-semibold text-white">LIVE</span>
			{/snippet}
			<div class="text-body">Card body content goes here.</div>
		</SetupCard>
	{/snippet}
</Story>
