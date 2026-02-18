<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AppHeader from './AppHeader.svelte';

	const { Story } = defineMeta({
		title: 'Layout/AppHeader',
		component: AppHeader,
		tags: ['autodocs'],
		argTypes: {
			variant: { control: 'select', options: ['on-primary', 'on-white'] },
			showUser: { control: 'boolean' },
			rounded: { control: 'boolean' },
			shareInput: { control: 'boolean' },
			countyName: { control: 'text' },
			question: { control: 'text' },
			title: { control: 'text' }
		}
	});
</script>

<Story name="With Question" args={{ countyName: 'ABC COUNTY', question: 'WHAT SHOULD WE DO TO MAKE SURE SOCIAL MEDIA IS HEALTHY FOR TEENS?', variant: 'on-primary' }}>
	{#snippet children(args)}
		<AppHeader {...args} />
	{/snippet}
</Story>

<Story name="Rounded + Share Input" args={{ countyName: 'ABC COUNTY', question: 'WHAT SHOULD WE DO TO MAKE SURE SOCIAL MEDIA IS HEALTHY FOR TEENS IN UTAH?', variant: 'on-primary', rounded: true, shareInput: true }}>
	{#snippet children(args)}
		<AppHeader {...args} />
	{/snippet}
</Story>

<Story name="With Title" args={{ countyName: 'ABC COUNTY', title: 'PROFILE', variant: 'on-primary' }}>
	{#snippet children(args)}
		<AppHeader {...args} />
	{/snippet}
</Story>

<Story name="Compact" args={{ countyName: 'ABC COUNTY', variant: 'on-primary' }}>
	{#snippet children(args)}
		<AppHeader {...args} />
	{/snippet}
</Story>

<Story name="On White" args={{ countyName: 'ABC COUNTY', question: 'WHAT DO YOU THINK?', variant: 'on-white' }}>
	{#snippet children(args)}
		<AppHeader {...args} />
	{/snippet}
</Story>
