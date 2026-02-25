<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AppHeader from './AppHeader.svelte';

	const { Story } = defineMeta({
		title: 'Layout/AppHeader',
		component: AppHeader,
		tags: ['autodocs'],
		argTypes: {
			countyName: { control: 'text' },
			question: { control: 'text' },
			title: { control: 'text' },
			variant: { control: 'select', options: ['on-primary', 'on-white'] },
			showUser: { control: 'boolean' },
			compact: { control: 'boolean' },
			rounded: { control: 'boolean' },
			shareInput: { control: 'boolean' }
		}
	});
</script>

<Story name="On Primary" args={{ countyName: 'UTAH COUNTY', question: 'AI & ONLINE SAFETY', title: 'What should we do to make sure social media helps us, not hurts us?', variant: 'on-primary' }}>
	{#snippet children(args)}
		<AppHeader {...args} />
	{/snippet}
</Story>

<Story name="On White" args={{ countyName: 'UTAH COUNTY', question: 'AI & ONLINE SAFETY', title: 'What should we do to make sure social media helps us, not hurts us?', variant: 'on-white' }}>
	{#snippet children(args)}
		<AppHeader {...args} />
	{/snippet}
</Story>

<Story name="Rounded with Share Input" args={{ countyName: 'UTAH COUNTY', question: 'AI & ONLINE SAFETY', variant: 'on-primary', rounded: true, shareInput: true }}>
	{#snippet children(args)}
		<div class="bg-card">
			<AppHeader {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Minimal" args={{ countyName: 'UTAH COUNTY', variant: 'on-primary' }}>
	{#snippet children(args)}
		<AppHeader {...args} />
	{/snippet}
</Story>

<Story name="No User Badge" args={{ countyName: 'UTAH COUNTY', title: 'Report Back', variant: 'on-primary', showUser: false }}>
	{#snippet children(args)}
		<AppHeader {...args} />
	{/snippet}
</Story>
