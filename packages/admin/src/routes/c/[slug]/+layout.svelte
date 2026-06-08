<script lang="ts">
	import { page } from '$app/state';
	import { REGIONS } from '@civicos/shared/data/regions';

	let { children } = $props();

	const region = $derived(REGIONS[page.params.slug ?? '']);

	const isLive = $derived(region && region.conversationsActive !== false);

	// Main conversation tabs (Events is the only one wired today)
	const tabs = [
		{ label: 'Overview', href: 'overview' },
		{ label: 'Open Poll', href: 'open-poll' },
		{ label: 'Participants', href: 'participants' },
		{ label: 'Events', href: 'events' },
		{ label: 'Learnings', href: 'learnings' }
	];

	const activeTab = $derived(
		tabs.find((t) => page.url.pathname.startsWith(`/c/${page.params.slug}/${t.href}`))?.href
	);
</script>

{#if !region}
	<div class="text-muted-foreground p-8">Unknown conversation: {page.params.slug}</div>
{:else}
	<!-- Top bar -->
	<header class="border-border flex h-28 items-center justify-between border-b px-7 py-5">
		<h1 class="text-4xl font-bold leading-none">{region.heroHeader}</h1>
		<div class="flex items-center gap-1">
			{#if isLive}
				<span
					class="bg-primary text-primary-foreground px-1.5 py-0.5 text-sm font-semibold leading-5"
				>
					LIVE
				</span>
			{/if}
			<a
				href={region.shareUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="bg-destructive/10 text-destructive px-1.5 py-0.5 text-sm font-medium leading-5 underline"
			>
				{region.shareUrl.replace(/^https?:\/\//, '')} ↗
			</a>
		</div>
	</header>

	<!-- Main tabs -->
	<nav class="border-border flex items-center border-b px-5">
		{#each tabs as tab}
			<a
				href={`/c/${region.slug}/${tab.href}`}
				class={`relative h-11 px-2.5 py-3 text-sm font-medium ${
					activeTab === tab.href
						? 'text-foreground border-destructive border-b-2'
						: 'text-foreground/50 hover:text-foreground/80'
				}`}
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	{@render children?.()}
{/if}
