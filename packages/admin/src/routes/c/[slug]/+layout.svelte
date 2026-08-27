<script lang="ts">
	import { page, navigating } from '$app/state';
	import ConversationTabSkeleton from '$lib/components/skeletons/ConversationTabSkeleton.svelte';
	import { resolve } from '$app/paths';

	let { data, children } = $props();

	const campaign = $derived(data.campaign);
	const title = $derived(campaign.title);
	const isLive = $derived(campaign.status === 'live');

	// Main conversation tabs
	const tabs = [
		{ label: 'Setup', href: 'overview' },
		{ label: 'Open Poll', href: 'open-poll' },
		{ label: 'Events', href: 'events' }
	];

	const tabFor = (pathname: string) =>
		tabs.find((t) => pathname.startsWith(`/c/${page.params.slug}/${t.href}`))?.href ?? '';

	// The tab currently committed (`page.url` only updates once navigation
	// resolves), vs. the tab we're navigating *to* right now.
	const committedTab = $derived(tabFor(page.url.pathname));
	const pendingNav = $derived(navigating.to ? tabFor(navigating.to.url.pathname) : '');

	// Highlight the in-flight destination the instant it's clicked instead of
	// waiting for its `load` to resolve.
	const activeTab = $derived(pendingNav || committedTab);

	// SvelteKit keeps the previous tab on screen while the destination's `load`
	// resolves, so a click looks like nothing happened. Show a matching skeleton
	// for the destination, but only for real top-level tab switches.
	const pendingTab = $derived(pendingNav && pendingNav !== committedTab ? pendingNav : null);
</script>

<!-- Top bar -->
<header
	class="flex min-h-28 flex-col items-start justify-between gap-3 border-b border-foreground/30 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-7 sm:py-5"
>
	<h1 class="font-display min-w-0 flex-1 text-h3 font-bold text-balance md:text-h2">
		{title}
	</h1>
	<div class="flex max-w-full shrink-0 items-center gap-1 overflow-hidden font-ui">
		{#if isLive}
			<span class="shrink-0 bg-success px-2 py-0.5 text-caption font-medium text-white">
				LIVE
			</span>
		{/if}
		{#if campaign.shareUrl}
			<a
				href={campaign.shareUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="truncate bg-primary/10 px-2 py-0.5 text-caption font-medium text-primary underline"
			>
				{campaign.shareUrl.replace(/^https?:\/\//, '')} ↗
			</a>
		{/if}
	</div>
</header>

<!-- Main tabs -->
<nav
	class="flex flex-nowrap items-center overflow-x-auto border-b border-foreground/30 px-5 font-ui"
>
	{#each tabs as tab (tab.href)}
		<a
			href={resolve(`/c/${campaign.slug}/${tab.href}`)}
			class={`relative h-12 shrink-0 px-3 py-3 text-body font-medium whitespace-nowrap ${
				activeTab === tab.href
					? 'border-b-[3px] border-primary text-primary'
					: 'text-foreground/50 hover:text-foreground/80'
			}`}
		>
			{tab.label}
		</a>
	{/each}
</nav>

{#if pendingTab}
	<ConversationTabSkeleton tab={pendingTab} />
{:else}
	{@render children?.()}
{/if}
