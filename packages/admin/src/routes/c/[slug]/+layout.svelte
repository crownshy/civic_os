<script lang="ts">
	import { page, navigating } from '$app/state';
	import ConversationTabSkeleton from '$lib/components/skeletons/ConversationTabSkeleton.svelte';

	let { data, children } = $props();

	const region = $derived(data.region);
	const conversation = $derived(data.conversation);

	const title = $derived(conversation?.title ?? region.heroHeader);
	const isLive = $derived(
		conversation ? conversation.isLive : region.conversationsActive !== false
	);

	// Main conversation tabs
	const tabs = [
		{ label: 'Overview', href: 'overview' },
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

{#if !region}
	<div class="text-muted-foreground p-8">Unknown conversation: {page.params.slug}</div>
{:else}
	<!-- Top bar -->
	<header
		class="border-foreground/30 flex min-h-28 flex-col items-start justify-between gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-7 sm:py-5"
	>
		<h1 class="font-display min-w-0 flex-1 text-5xl font-bold leading-tight text-balance">
			{title}
		</h1>
		<div class="font-ui flex max-w-full shrink-0 items-center gap-1 overflow-hidden">
			{#if isLive}
				<span
					class="bg-success shrink-0 px-2 py-0.5 text-body font-semibold leading-6 text-white"
				>
					LIVE
				</span>
			{/if}
			<a
				href={region.shareUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="bg-primary/10 text-primary truncate px-2 py-0.5 text-body font-medium leading-6 underline"
			>
				{region.shareUrl.replace(/^https?:\/\//, '')} ↗
			</a>
		</div>
	</header>

	<!-- Main tabs -->
	<nav class="border-foreground/30 font-ui flex flex-nowrap items-center overflow-x-auto border-b px-5">
		{#each tabs as tab (tab.href)}
			<a
				href={`/c/${region.slug}/${tab.href}`}
				class={`relative h-12 shrink-0 px-3 py-3 text-body font-medium whitespace-nowrap ${
					activeTab === tab.href
						? 'text-primary border-primary border-b-[3px]'
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
{/if}
