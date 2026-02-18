<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AlertBanner from './AlertBanner.svelte';

	const { Story } = defineMeta({
		title: 'UI/AlertBanner',
		component: AlertBanner,
		tags: ['autodocs'],
		argTypes: {
			message: { control: 'text' }
		}
	});
</script>

<Story name="Default" args={{ message: 'You have not verified your email yet! Click here to complete.' }}>
	{#snippet children(args)}
		<AlertBanner {...args} />
	{/snippet}
</Story>
