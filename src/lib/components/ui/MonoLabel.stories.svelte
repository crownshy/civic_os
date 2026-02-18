<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import MonoLabel from './MonoLabel.svelte';

	const { Story } = defineMeta({
		title: 'UI/MonoLabel',
		component: MonoLabel,
		tags: ['autodocs'],
		argTypes: {
			size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
			variant: { control: 'select', options: ['primary', 'white', 'muted'] }
		}
	});
</script>

<Story name="Primary SM" args={{ size: 'sm', variant: 'primary' }}>
	{#snippet children(args)}
		<MonoLabel {...args}>ABC COUNTY</MonoLabel>
	{/snippet}
</Story>

<Story name="Primary MD" args={{ size: 'md', variant: 'primary' }}>
	{#snippet children(args)}
		<MonoLabel {...args}>WHERE WE AGREE</MonoLabel>
	{/snippet}
</Story>

<Story name="Primary LG" args={{ size: 'lg', variant: 'primary' }}>
	{#snippet children(args)}
		<MonoLabel {...args}>ABC COUNTY</MonoLabel>
	{/snippet}
</Story>

<Story name="On Primary" args={{ size: 'sm', variant: 'white' }}>
	{#snippet children(args)}
		<div class="bg-primary p-4">
			<MonoLabel {...args}>ABC COUNTY</MonoLabel>
		</div>
	{/snippet}
</Story>

<Story name="Muted" args={{ size: 'xs', variant: 'muted' }}>
	{#snippet children(args)}
		<MonoLabel {...args}>POSTED JAN 02 2026</MonoLabel>
	{/snippet}
</Story>
