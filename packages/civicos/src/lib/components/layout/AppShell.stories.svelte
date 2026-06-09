<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AppShell from './AppShell.svelte';

	const { Story } = defineMeta({
		title: 'Layout/AppShell',
		component: AppShell,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});
</script>

<Story name="Default" args={{}}>
	{#snippet children(args)}
		<AppShell {...args}>
			<div class="bg-primary px-8 py-6">
				<span class="font-mono text-sm text-white/80">UTAH COUNTY</span>
			</div>
			<div class="px-8 py-12">
				<h1 class="font-sans text-4xl font-bold text-primary">AI & Online Safety</h1>
				<p class="mt-4 font-sans text-lg text-primary/80">
					What should we do to make sure social media helps us, not hurts us?
				</p>
			</div>
		</AppShell>
	{/snippet}
</Story>

<Story name="With Background" args={{}}>
	{#snippet children(args)}
		<AppShell class="bg-primary" {...args}>
			<div class="flex min-h-dvh flex-col items-center justify-center px-8">
				<h1 class="font-sans text-5xl font-bold text-white">Welcome!</h1>
				<p class="mt-4 text-center font-sans text-lg text-white/80">
					Your voice matters in this conversation.
				</p>
			</div>
		</AppShell>
	{/snippet}
</Story>
