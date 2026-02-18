<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PillInput from './PillInput.svelte';

	const { Story } = defineMeta({
		title: 'UI/PillInput',
		component: PillInput,
		tags: ['autodocs'],
		argTypes: {
			showAvatar: { control: 'boolean' },
			variant: { control: 'select', options: ['on-primary', 'on-white'] },
			placeholder: { control: 'text' }
		}
	});
</script>

<Story name="Default" args={{ placeholder: 'YOUR NAME', showAvatar: true }}>
	{#snippet children(args)}
		<PillInput {...args} />
	{/snippet}
</Story>

<Story name="Email" args={{ placeholder: 'ABC@GMAIL.COM', showAvatar: true }}>
	{#snippet children(args)}
		<PillInput {...args} />
	{/snippet}
</Story>

<Story name="No Avatar" args={{ placeholder: 'SHARE A NEW IDEA...', showAvatar: false }}>
	{#snippet children(args)}
		<PillInput {...args} />
	{/snippet}
</Story>

<Story name="On Primary" args={{ placeholder: 'SEARCH...', variant: 'on-primary', showAvatar: false }}>
	{#snippet children(args)}
		<div class="bg-primary p-8">
			<PillInput {...args} />
		</div>
	{/snippet}
</Story>
