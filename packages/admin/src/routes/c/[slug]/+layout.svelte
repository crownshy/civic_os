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

	// Where participants actually land:
	// `<place>.<base>/<org>/conversations/<campaign-slug>`. Derived in `toSummary`
	// rather than read out of `regions.ts`, so every Campaign has one from the
	// moment it is created; publishing it to a Place moves it to that subdomain,
	// it does not give it its first address (ADR 0007).
	const publicUrl = $derived(campaign.shareUrl?.replace(/\/$/, '') ?? '');

	// Only reached when there is genuinely no address to link to. Which of the two
	// reasons it is matters: one is fixed on Setup, the other is a deployment
	// setting no Host can reach.
	const blockerCopy = {
		slug: {
			text: 'No participant site yet',
			title: 'A Campaign is addressed by its slug. Set one on Setup to give it a participant site.'
		},
		apex: {
			text: 'Participant site not configured',
			title:
				'This admin deployment has no PUBLIC_PARTICIPANT_BASE_URL, so it cannot build share links for any Campaign.'
		}
	} as const;
	const blocker = $derived(blockerCopy[campaign.shareUrlBlocker ?? 'slug']);

	/** Same write the Open Poll Status card makes, so the two cannot disagree. */
	async function setLive(next: boolean) {
		await data.api.UpdateConversation(
			{ is_live: next },
			{ params: { conversation_id: campaign.id } }
		);
		if (next) await mirrorPoll();
		await invalidate(`campaign:${page.params.slug}`);
		await invalidate('app:conversations');
	}

	/**
	 * Put this Campaign's poll identity on the public payload as it goes live.
	 *
	 * civicos reads `metadata.poll` because the Polis step is 401 anonymously, and
	 * until this runs a Campaign sends its participants to whichever poll
	 * `regions.ts` guesses from their zip. Publishing to a Place writes the same
	 * object, but a Place is no longer what makes a Campaign reachable, so that
	 * can no longer be the only moment it happens.
	 *
	 * Nothing to do when the Polis step has not yet exposed a poll id
	 * (`toolConfig` is null for a while after a step is created). Going live again
	 * later re-runs this, so it heals rather than needing a one-off repair.
	 */
	async function mirrorPoll() {
		if (!campaign.pollIdentity) return;

		try {
			await data.api.PatchConversationMetadata(
				{ poll: campaign.pollIdentity },
				{ params: { conversation_id: campaign.id } }
			);
		} catch (e) {
			// Not worth blocking the launch: the Campaign is live either way, it just
			// falls back to the `regions.ts` poll until this succeeds.
			console.error('Mirroring the poll identity into metadata failed', e);
		}
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

<!-- Top bar. Title and meta stay stacked until xl. The sidebar appears at md and
     eats ~260px, so a side-by-side header below xl splits a ~700px column between
     a 36px title and a long share URL, and truncates both to nothing. -->
<header
	class="flex flex-col items-start gap-2 border-b border-foreground/30 px-4 py-4 xl:min-h-28 xl:flex-row xl:items-center xl:justify-between xl:gap-4 xl:px-7 xl:py-5"
>
	<h1
		class="font-display max-w-full min-w-0 flex-1 text-h3 font-bold text-balance break-words md:text-h2"
	>
		{title}
	</h1>
	<div class="flex w-full min-w-0 items-center gap-1 font-ui xl:w-auto xl:max-w-[33%]">
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
				class="flex min-w-0 items-center gap-1 bg-primary/10 px-2 py-0.5 text-caption font-medium text-primary underline"
			>
				<!-- The host is the part worth keeping when there is no room for the
				     whole address, so the path is what the ellipsis eats. -->
				<span class="truncate">{publicUrl.replace(/^https?:\/\//, '')}</span>
				<span class="shrink-0" aria-hidden="true">↗</span>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{:else if campaign.shareUrlBlocker === 'apex'}
			<!-- Nothing on Setup fixes this one, so it is stated rather than linked. -->
			<span
				class="shrink-0 px-2 py-0.5 text-caption font-medium text-muted-foreground"
				title={blocker.title}
			>
				{blocker.text}
			</span>
		{:else}
			<!-- Rendering nothing here made a Campaign look like it had a site we just
			     weren't linking. Link to where that is fixed rather than stating a dead
			     fact. -->
			<a
				href={resolve('/c/[slug]/overview', { slug: campaign.slug })}
				class="shrink-0 px-2 py-0.5 text-caption font-medium text-muted-foreground underline"
				title={blocker.title}
			>
				{blocker.text}
			</a>
		{/if}
	</div>
</header>

<!-- Main tabs -->
<nav
	class="flex flex-nowrap items-center overflow-x-auto border-b border-foreground/30 px-1 font-ui xl:px-4"
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
