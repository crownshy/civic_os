<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AlertBanner from './AlertBanner.svelte';

	const { Story } = defineMeta({
		title: 'Primitives/AlertBanner',
		component: AlertBanner,
		tags: ['autodocs'],
		argTypes: {
			message: { control: 'text' }
		}
	});
</script>

<Story name="Default" args={{ message: 'Your email has not been verified yet. Check your inbox for the verification link.' }}>
	{#snippet children(args)}
		<div class="p-6">
			<AlertBanner {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Short Message" args={{ message: 'Something went wrong. Please try again.' }}>
	{#snippet children(args)}
		<div class="p-6">
			<AlertBanner {...args} />
		</div>
	{/snippet}
</Story>
