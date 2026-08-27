<script lang="ts">
	import { page, navigating } from '$app/state';
	import { invalidate } from '$app/navigation';
	import ConversationTabSkeleton from '$lib/components/skeletons/ConversationTabSkeleton.svelte';
	import LiveToggle from './LiveToggle.svelte';
	import { resolve } from '$app/paths';

	let { data, children } = $props();

	const campaign = $derived(data.campaign);
	const conversation = $derived(data.conversation);
	const title = $derived(campaign.title);
	// Prefer the Conversation's own flag; `status` is the summary's stale-by-a-load
	// copy of it, and only stands in when the conversation did not resolve.
	const isLive = $derived(conversation ? conversation.isLive : campaign.status === 'live');

	// Where participants actually land. civicos resolves a Campaign from the
	// SUBDOMAIN, not from a path segment: there is no `/<slug>` route, so the
	// region root IS the Campaign's site. Empty for Campaigns with no legacy
	// region entry, which have no participant site at all yet.
	const publicUrl = $derived(campaign.shareUrl?.replace(/\/$/, '') ?? '');

	/** Same write the Open Poll Status card makes, so the two cannot disagree. */
	async function setLive(next: boolean) {
		await data.api.UpdateConversation(
			{ is_live: next },
			{ params: { conversation_id: campaign.id } }
		);
		await invalidate(`campaign:${page.params.slug}`);
		await invalidate('app:conversations');
	}

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
		<LiveToggle {isLive} onToggle={setLive} />
		{#if publicUrl}
			<!-- Absolute participant-app URL on another host, so there is no SvelteKit
			     route for resolve() to check it against. -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={publicUrl}
				target="_blank"
				rel="noopener noreferrer"
				title="Open the participant site in a new tab"
				class="truncate bg-primary/10 px-2 py-0.5 text-caption font-medium text-primary underline"
			>
				{publicUrl.replace(/^https?:\/\//, '')} ↗
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{:else}
			<!-- Rendering nothing here made a backend-created Campaign look like it
			     had a site we just weren't linking. It has none until it gets a
			     regions.ts entry. -->
			<span
				class="shrink-0 px-2 py-0.5 text-caption font-medium text-muted-foreground"
				title="civicos resolves Campaigns by subdomain, so this one needs a regions.ts entry before participants can reach it."
			>
				No participant site yet
			</span>
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

<!-- SvelteKit reuses page components across a param change, so switching
     Conversations left the previous one's init-once state on screen: superForm's
     working copy on Setup, filters and dialogs on the Open Poll tabs. Keying on
     the Conversation remounts the tab so all of it re-seeds from the new `data`.
     Keyed on the id, not the slug, because renaming a slug navigates too and
     must not tear the editor down mid-edit. -->
{#if pendingTab}
	<ConversationTabSkeleton tab={pendingTab} />
{:else}
	{#key campaign.id}
		{@render children?.()}
	{/key}
{/if}
