<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PillButton from './PillButton.svelte';

	const { Story } = defineMeta({
		title: 'UI/PillButton',
		component: PillButton,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['filled', 'outline', 'ghost', 'filled-white']
			},
			size: { control: 'select', options: ['sm', 'md', 'lg'] },
			fullWidth: { control: 'boolean' },
			disabled: { control: 'boolean' }
		}
	});
</script>

<Story name="Filled" args={{ variant: 'filled' }}>
	{#snippet children(args)}
		<PillButton {...args}>LET'S GO!</PillButton>
	{/snippet}
</Story>

<Story name="Outline" args={{ variant: 'outline' }}>
	{#snippet children(args)}
		<PillButton {...args}>DISAGREE</PillButton>
	{/snippet}
</Story>

<Story name="Ghost" args={{ variant: 'ghost' }}>
	{#snippet children(args)}
		<div class="bg-primary p-8">
			<PillButton {...args}>CONTINUE IN 5...</PillButton>
		</div>
	{/snippet}
</Story>

<Story name="Filled White" args={{ variant: 'filled-white' }}>
	{#snippet children(args)}
		<PillButton {...args}>JOIN THE CONVERSATION</PillButton>
	{/snippet}
</Story>

<Story name="Full Width" args={{ variant: 'filled', fullWidth: true }}>
	{#snippet children(args)}
		<PillButton {...args}>SHARE YOUR THOUGHTS NOW</PillButton>
	{/snippet}
</Story>

<Story name="Small" args={{ variant: 'filled', size: 'sm' }}>
	{#snippet children(args)}
		<PillButton {...args}>SMALL</PillButton>
	{/snippet}
</Story>

<Story name="Disabled" args={{ variant: 'filled', disabled: true }}>
	{#snippet children(args)}
		<PillButton {...args}>DISABLED</PillButton>
	{/snippet}
</Story>
