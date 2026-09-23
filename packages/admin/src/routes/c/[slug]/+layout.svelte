<script lang="ts">
	import { page, navigating } from '$app/state';
	import { invalidate } from '$lib/activity.svelte';
	import ConversationTabSkeleton from '$lib/components/skeletons/ConversationTabSkeleton.svelte';
	import LiveToggle from './LiveToggle.svelte';
	import { setCampaignLive } from '$lib/api/campaign-live';
	import { resolve } from '$app/paths';

	let { data, children } = $props();

	const campaign = $derived(data.campaign);
	const conversation = $derived(data.conversation);
	const title = $derived(campaign.title);
	// Prefer the Conversation's own flag; `status` is the summary's stale-by-a-load
	// copy of it, and only stands in when the conversation did not resolve.
	const isLive = $derived(conversation ? conversation.isLive : campaign.status === 'live');

	// Where participants actually land:
	// `<base>/<org>/conversations/<conversation-slug>`. Derived in `toSummary`
	// rather than read out of `regions.ts`, so every Campaign has one from the
	// moment it is created; publishing it to a Place lists it on that Place's
	// page, it does not give it its first address (ADR 0011).
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

	// Repairing the mirror, not writing anything new: `pollIdentity` is built from
	// the Polis step admin can read and merged over what is stored, so this can
	// only ever add the poll id civicos was missing.
	let repairing = $state(false);
	let repairError = $state<string | null>(null);

	async function repairPollMirror() {
		const poll = campaign.pollIdentity;
		if (!poll || repairing) return;

		repairing = true;
		repairError = null;
		try {
			await data.api.PatchConversationMetadata(
				{ poll },
				{ params: { conversation_id: campaign.id } }
			);
			await invalidate(`campaign:${page.params.slug}`);
		} catch (e) {
			console.error('Repairing the poll mirror failed', e);
			repairError = e instanceof Error ? e.message : 'Could not write the mirror.';
		} finally {
			repairing = false;
		}
	}

	const setLive = (next: boolean) =>
		setCampaignLive({
			api: data.api,
			conversationId: campaign.id,
			next,
			pollLaunched: campaign.pollLaunched,
			reload: async () => {
				await invalidate(`campaign:${page.params.slug}`);
				// The sidebar's status dot reads the permitted list, not this page's data.
				await invalidate('app:conversations');
			},
			pollIdentity: () => campaign.pollIdentity
		});

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

		<!-- Participants read `metadata.poll`, never the step, so a Campaign can
		     look complete here and still serve a poll that cannot load. Said out
		     loud, next to the link it breaks. -->
		{#if campaign.pollBlocker === 'mirror'}
			<button
				type="button"
				onclick={repairPollMirror}
				disabled={repairing}
				title={repairError ??
					'This Campaign has a Polis poll, but participants cannot see which one: the copy they read was never written. Click to write it.'}
				class="shrink-0 px-2 py-0.5 text-caption font-medium text-destructive underline"
			>
				{repairing
					? 'Fixing…'
					: repairError
						? 'Could not fix poll link'
						: 'Poll not visible to participants'}
			</button>
		{:else if campaign.pollBlocker === 'step'}
			<span
				class="shrink-0 px-2 py-0.5 text-caption font-medium text-destructive"
				title="This Campaign has no Polis poll, so there is nothing for participants to vote in. It was not created here."
			>
				No poll
			</span>
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
