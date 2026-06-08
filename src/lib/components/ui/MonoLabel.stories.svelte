<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import MonoLabel from './MonoLabel.svelte';

	const { Story } = defineMeta({
		title: 'Primitives/MonoLabel',
		component: MonoLabel,
		tags: ['autodocs'],
		argTypes: {
			size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
			variant: { control: 'select', options: ['primary', 'white', 'muted'] }
		}
	});
</script>

<Story name="Primary" args={{ size: 'sm', variant: 'primary' }}>
	{#snippet children(args)}
		<MonoLabel {...args}>UTAH COUNTY</MonoLabel>
	{/snippet}
</Story>

<Story name="White" args={{ variant: 'white' }}>
	{#snippet children(args)}
		<div class="rounded-xl bg-primary p-6">
			<MonoLabel {...args}>YOU</MonoLabel>
		</div>
	{/snippet}
</Story>

<Story name="Muted" args={{ variant: 'muted' }}>
	{#snippet children(args)}
		<MonoLabel {...args}>Jan 02 2026</MonoLabel>
	{/snippet}
</Story>

<Story name="All Sizes" args={{}}>
	{#snippet children(args)}
		<div class="flex flex-col gap-3">
			<MonoLabel size="xs">EXTRA SMALL — DID YOU KNOW...</MonoLabel>
			<MonoLabel size="sm">SMALL — POP QUIZ</MonoLabel>
			<MonoLabel size="md">MEDIUM — AGREE</MonoLabel>
			<MonoLabel size="lg">LARGE — SUBMIT</MonoLabel>
		</div>
	{/snippet}
</Story>
