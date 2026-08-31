<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import { Button } from '$lib/components/ui';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? '');

	const heading = $derived(status === 404 ? 'This page is not here' : 'Something went wrong');
</script>

<svelte:head>
	<title>{heading}</title>
</svelte:head>

<AppShell border={false}>
	<div
		class="flex h-full flex-col items-center justify-center bg-gradient-primary px-6 text-yellow-950"
	>
		<span class="rounded-[30px] bg-yellow-950 px-3.5 py-2 font-mono text-sm font-medium text-white">
			{status}
		</span>

		<h1
			class="mt-6 max-w-xl text-center font-display text-4xl leading-[1.05] font-medium tracking-display md:text-5xl"
		>
			{heading}
		</h1>

		{#if message}
			<p class="mt-5 max-w-md text-center font-sans text-base leading-6 font-medium md:text-lg">
				{message}
			</p>
		{/if}

		<!-- No "go to the right Place" link: a Campaign runs in several Places at
		     once, so there is no single correct address to offer. -->
		<Button variant="soft" size="md" href="https://www.bloom-project.org/" class="mt-8">
			BLOOM PROJECT
		</Button>
	</div>
</AppShell>
