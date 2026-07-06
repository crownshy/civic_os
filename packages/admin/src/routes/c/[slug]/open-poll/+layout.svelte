<script lang="ts">
	import { page, navigating } from '$app/state';
	import OpenPollSkeleton from '$lib/components/skeletons/OpenPollSkeleton.svelte';

	let { data, children } = $props();

	const subTabs = [
		{ label: 'Participants', href: '/participants' },
		{ label: 'Moderation', href: '/moderation' },
		{ label: 'Insights', href: '/insights' }
	];

	const openPollBase = $derived(`/c/${page.params.slug}/open-poll`);

	const subTabFor = (pathname: string) =>
		subTabs.find((t) => pathname.startsWith(openPollBase + t.href))?.href ?? '';

	// The tab that's currently committed (`page.url` only updates once navigation
	// resolves), vs. the tab we're navigating *to* right now.
	const committedSubTab = $derived(subTabFor(page.url.pathname));
	const pendingNav = $derived(navigating.to ? subTabFor(navigating.to.url.pathname) : '');

	// Highlight the in-flight destination the instant it's clicked instead of
	// waiting for its `load` to resolve — otherwise the highlight lags a whole
	// fetch behind the click.
	const activeSubTab = $derived(pendingNav || committedSubTab);

	// While a sub-tab's `load` resolves, SvelteKit keeps the previous page on
	// screen — so a tab click looks like nothing happened. Show a matching
	// skeleton for the destination, but only for real tab switches.
	const pendingSubTab = $derived(
		pendingNav && pendingNav !== committedSubTab ? pendingNav : null
	);
</script>

<!-- Open Poll sub-tabs strip -->
<nav class="border-border font-ui flex items-center gap-2 border-b px-5">
	{#each subTabs as tab (tab.href)}
		<a
			href={openPollBase + tab.href}
			class={`px-4 pt-3 pb-2 text-body font-medium ${
				activeSubTab === tab.href
					? 'text-destructive border-destructive border-b-[3px]'
					: 'text-foreground/70 hover:text-foreground'
			}`}
		>
			{tab.label}
		</a>
	{/each}
</nav>

<!-- Padding lives on the inner wrapper, NOT the scroll container: a `sticky top-0`
     header (Insights tables) pins to the scrollport edge, so top padding here would
     leave a gap that scrolling rows peek through. Same spacing, no sticky gap. -->
<div class="flex-1 overflow-y-auto">
	<div class="px-5 py-5">
		{#if pendingSubTab}
			<OpenPollSkeleton tab={pendingSubTab} />
		{:else}
			{@render children?.()}
		{/if}
	</div>
</div>
