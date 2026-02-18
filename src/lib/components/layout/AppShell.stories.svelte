<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AppShell from './AppShell.svelte';

	const { Story } = defineMeta({
		title: 'Layout/AppShell',
		component: AppShell,
		tags: ['autodocs']
	});
</script>

<Story name="Default">
	{#snippet children(args)}
		<AppShell {...args}>
			<div class="flex min-h-dvh items-center justify-center bg-primary">
				<p class="font-mono text-2xl font-medium text-primary-foreground">APP CONTENT</p>
			</div>
		</AppShell>
	{/snippet}
</Story>
