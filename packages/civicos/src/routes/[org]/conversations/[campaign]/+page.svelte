<script lang="ts">
	import { campaignPath } from '@civicos/shared/data/place';
	import { fade } from 'svelte/transition';
	import { goto, invalidate, preloadCode } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Button, Dialog, ZipInput, Accordion, StickyNav } from '$lib/components/ui';
	import { Mail } from 'lucide-svelte';
	import { Input } from '@civicos/shared/ui/input';
	import { session } from '$lib/services/session.svelte';
	import type { ParticipantSession } from '$lib/services/participant';
	import { getRegionByZipcode } from '$lib/config/regions';
	import type { RegionConfig } from '$lib/config/regions';
	import { placeNameFor, type Campaign } from '$lib/config/campaign';
	import {
		HERO_BLURB,
		OPEN_POLL_EXPLAINER,
		FOOTER_LINKS,
		NAV_SECTIONS
	} from '$lib/config/landing-copy';
	import { trackEvent } from '@lukulent/svelte-umami';
	import { safeHref } from '@civicos/shared/sanitize';
	import { HOST_COPY_PROSE_CLASS, renderHostCopy, toContextSections } from '$lib/config/host-copy';
	import { listSeparator } from '$lib/utils/list';
	import { AppShell } from '$lib/components/layout';
	import JoinSkeleton from './JoinSkeleton.svelte';
	import VotingSkeleton from './contribute/VotingSkeleton.svelte';

	const region: RegionConfig = page.data.region;
	const campaign: Campaign = page.data.campaign;
	const hostCopy = page.data.hostCopy;
	const placeName = placeNameFor(campaign, region);
	// The same Key Question /contribute resolves, so the skeleton shown here and
	// the voting screen it becomes label the statement identically.
	const question = campaign?.poll?.question || region.question;
	const contributePath = campaignPath(campaign.slug, page.params.org, 'contribute');
	// The organizations to credit, from `metadata.cohosts` where admin mirrored
	// the grants. Empty for a Campaign with none, rather than the catch-all's
	// `partners`, which credited The Bloom Project on everybody's Campaign.
	const cohosts = campaign.cohosts;
	// Resolved in the layout load, so a Host's saved questions replace the
	// `regions.ts` placeholders without this page knowing which it got.
	const faq = page.data.faq;
	// The Host's Context copy, cut at its headings so each one gets its own
	// section and its own nav pill. A description with no headings comes back as
	// the single Context section this page rendered before.
	const contextSections = toContextSections(hostCopy.context);
	// `context` in NAV_SECTIONS is a placeholder for those pills; FAQ drops out
	// when there are no questions, matching the section below.
	const navSections = NAV_SECTIONS.flatMap((section) => {
		if (section.id === 'context') return contextSections.map(({ id, label }) => ({ id, label }));
		if (section.id === 'faq' && faq.length === 0) return [];
		if (section.id === 'your-host' && cohosts.length === 0) return [];
		return [section];
	});
	// Who the server says this is, resolved from the cookie in the root layout.
	// A returning participant gets CONTINUE on the first paint instead of after
	// hydration. Only a zip counts: an email-only signup has an account but has
	// never told us where they are, so it is not a session to continue.
	//
	// This has to agree with the gate on `/contribute`, which reads the server
	// answer and nothing else. Anything CONTINUE lets through that the gate then
	// turns away is a redirect straight back to this page, and on a client side
	// navigation that is silent: the button appears dead. So the cached session
	// only stands in where the server has no answer to disagree with, which is
	// the one case it was ever meant to cover.
	const participant: ParticipantSession | null = $derived(page.data.participant);
	const participantResolved: boolean = $derived(page.data.participantResolved);
	const isReturning = $derived(
		!!participant?.zipCode || (!participantResolved && session.hasSession)
	);

	// Only the browser can read the cached session, so on the outage path
	// `isReturning` is false during SSR and may turn true at hydration. Rendering
	// the join form before then is what makes the CTA flip to CONTINUE under you.
	let hydrated = $state(false);
	const joinStateSettled = $derived(isReturning || hydrated);

	// --- Join (zip → /contribute) state ---
	// Seeded from the server answer, then owned by the field. Deliberately not a
	// writable `$derived`: it is bound into ZipInput's `$bindable`, and the local
	// value there does not survive an unrelated re-render such as the terms
	// dialog opening, which silently empties the field mid-join. Nothing on this
	// page changes the participant except a successful join, which navigates away
	// immediately, so there is no resync to miss.
	let zipCode = $state(page.data.participant?.zipCode || session.zipCode);
	let hasZip = $derived(!!zipCode.trim());
	// True from the click until `/contribute` has rendered, across the join
	// request, the participant invalidation and the navigation itself. Reset only
	// if we are still on this page afterwards: a failed join, or the gate on
	// `/contribute` sending us back.
	let leaving = $state(false);
	let zipFlash = $state(false);
	let hasAgreedToTos = $derived(session.hasAgreedToTos);
	let showAboutMessage = $state(false);
	let showTermsMessage = $state(false);

	// --- Email signup (bottom of page) state ---
	let email = $state('');
	let emailSubmitting = $state(false);
	let emailError = $state('');
	let emailSuccess = $state(false);

	// Pick up a zip carried over by the zip redirect in `handleJoin`
	onMount(() => {
		if (browser && !isReturning) {
			const params = new URLSearchParams(window.location.search);
			const zipParam = params.get('zip_code');
			if (zipParam) zipCode = zipParam;
		}
		// After the zip param, so the field never renders empty and then fills.
		hydrated = true;
		// Polis and the voting screens are the heaviest chunks on the site, and
		// almost everyone who lands here goes there next. Code only: preloading
		// data would run the `/contribute` gate before this visitor has joined.
		void preloadCode(contributePath);
	});

	function showTermsModal() {
		trackEvent('ShownTermsModal');
		showTermsMessage = true;
	}

	function handleAgreeToTos() {
		trackEvent('AgreedToTerms');
		session.markAgreedToTos();
		handleJoin();
	}

	async function handleJoin() {
		if (leaving) return;

		if (isReturning) {
			leaving = true;
			// Every Campaign shares one origin, so someone who joined a different
			// Campaign arrives here already known and never passes through `join`.
			// Put them on this Campaign's workflow on the way in. Not awaited: a
			// missing participation row is a reporting gap, not a reason to hold
			// CONTINUE back, and the request outlives the client-side navigation.
			void session.enterCampaign(campaign.id);
			await goto(contributePath);
			leaving = false;
			return;
		}

		const zipRegion = getRegionByZipcode(zipCode.trim());

		// A zip may send someone to another Campaign only where a region IS the
		// Campaign, which is Utah, Oregon and the catch-all. For a Campaign
		// published to a Place, the URL already names which Campaign this is, so
		// routing by zip would drop its participants on a different one.
		if (campaign.isLegacyRegion && zipRegion.slug !== region.slug) {
			trackEvent('UnsupportedZipCode', {
				zipCode,
				regionSlug: region.slug,
				zipRegion: zipRegion.slug
			});
			// A full load on this host rather than `goto`: the zip is read back in
			// `onMount`, which a client-side navigation between two Campaigns does
			// not re-run, because it reuses this component.
			const target = campaignPath(zipRegion.slug, zipRegion.hostName);
			window.location.href = `${target}?zip_code=${encodeURIComponent(zipCode.trim())}`;
			return;
		}

		leaving = true;
		// The Campaign the URL resolved to, not the zip's `regions.ts` entry. For
		// Utah and Oregon these are the same Conversation (the redirect above
		// guarantees the zip matches this Campaign); for a Campaign created in
		// admin only `campaign.id` is right, because its region is the catch-all
		// and would have put its participants in the USA catch-all poll.
		const success = await session.join(zipCode.trim(), undefined, campaign.id);
		if (!success) {
			leaving = false;
			return;
		}
		trackEvent('SucccesfullSignup');
		// The root layout resolved "anonymous" before this. Re-run it so the
		// server side gate on `/contribute` sees the participant that now exists.
		await invalidate('civicos:participant');
		await goto(contributePath);
		leaving = false;
	}

	function isValidEmail(value: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	// Email-only signup (no zip). Reuses session.join with empty zip — see
	// docs/adr/0002-landing-email-reuses-participant-flow.md for the rationale and
	// follow-up about a dedicated newsletter endpoint.
	async function handleEmailSignup() {
		emailError = '';
		const trimmed = email.trim();
		if (!trimmed) {
			emailError = 'Please enter an email address';
			return;
		}
		if (!isValidEmail(trimmed)) {
			emailError = 'Please enter a valid email address';
			return;
		}
		emailSubmitting = true;
		// A returning participant only needs the signup. Everyone else gets a
		// minimal session (no zip) first, because the signup is a call as this
		// user. Either way the Campaign is this page's, not a remembered one.
		if (session.hasSession) {
			await session.registerEmail(trimmed, campaign.id);
		} else {
			await session.join('', trimmed, campaign.id);
			await invalidate('civicos:participant');
		}
		emailSubmitting = false;
		emailSuccess = true;
	}
</script>

<svelte:head>
	<title>{campaign.title}{campaign.place ? ` — ${campaign.place.name}` : ''}</title>
</svelte:head>

<div class="min-h-screen bg-background text-yellow-950">
	<!-- Above-fold container: header + hero fill the viewport on desktop -->
	<div class="flex flex-col md:h-screen">
		<!-- Header chip row — bypasses AppShell. See docs/adr/0001-landing-bypasses-appshell.md -->
		<header class="flex items-center justify-between px-6 pt-4 pb-2">
			{#if campaign.place}
				<div class="flex items-center gap-2 font-mono text-sm font-medium text-primary uppercase">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
						/>
					</svg>
					{campaign.place.name.toUpperCase()}
				</div>
			{/if}
			<Button variant="pill" size="xs" onclick={() => (showAboutMessage = true)}>ABOUT→</Button>
		</header>

		<!-- Hero -->
		<section
			id="join"
			class="mx-auto flex w-full max-w-4xl scroll-mt-24 flex-col px-6 pt-4 pb-10 md:flex-1 md:pb-8"
		>
			<!-- Chip, headline, blurb, and join form — vertically centered on desktop -->
			<div class="flex flex-col items-center md:flex-1 md:justify-center">
				<div class="flex justify-center">
					<span
						class="rounded-[30px] bg-primary px-3.5 py-2 font-mono text-sm font-medium text-primary-foreground"
					>
						OPEN POLL
					</span>
				</div>
				<h1
					class="mt-3 text-center font-display text-5xl leading-[1.05] font-medium tracking-display text-primary md:text-6xl"
				>
					{campaign.title}
				</h1>
				<p
					class="mt-6 text-center font-sans text-base leading-5 font-medium md:text-lg md:leading-6 [&_a]:text-destructive"
				>
					{HERO_BLURB} <a href="#{contextSections[0]?.id ?? 'how-it-works'}">Learn more →</a>
				</p>

				<div class="mt-10 flex w-full max-w-sm flex-col items-center">
					<span class="font-display text-base font-medium opacity-80 md:text-lg">Your location</span
					>
					{#if joinStateSettled}
						<div class="mt-1.5 flex w-full flex-col items-center" in:fade={{ duration: 150 }}>
							<ZipInput bind:value={zipCode} disabled={isReturning} bind:flash={zipFlash} />
							<Button
								variant="primary"
								fullWidth
								disabled={leaving}
								onclick={() => {
									if (!hasZip) {
										zipFlash = true;
										return;
									}
									if (hasAgreedToTos) handleJoin();
									else showTermsModal();
								}}
								class="mt-4"
							>
								{isReturning ? 'CONTINUE' : 'JOIN THE CONVERSATION'}
							</Button>
							{#if session.error}
								<p class="mt-2 px-2 font-sans text-sm text-destructive">{session.error}</p>
							{/if}
						</div>
					{:else}
						<JoinSkeleton class="mt-1.5" />
					{/if}
				</div>
			</div>

			<!-- Hosted by strip, below the centered block and still above the fold on desktop. -->
			<!-- Logos deferred. Renders linked names until logo URLs reach `metadata.cohosts`. -->
			{#if cohosts.length > 0}
				<div class="mt-10 flex flex-col items-center gap-3 md:mt-6">
					<span class="font-display text-base font-medium opacity-80 md:text-lg">Hosted by</span>
					<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-center">
						{#each cohosts as cohost (cohost.name)}
							{#if cohost.logo}
								<a href={safeHref(cohost.url)} target="_blank" rel="noopener noreferrer">
									<img
										src={cohost.logo}
										alt={cohost.name}
										class="h-8 max-w-[120px] object-contain"
									/>
								</a>
							{:else if cohost.url}
								<a
									href={safeHref(cohost.url)}
									target="_blank"
									rel="noopener noreferrer"
									class="font-sans text-sm font-medium underline md:text-base"
								>
									{cohost.name}
								</a>
							{:else}
								<span class="font-sans text-sm font-medium md:text-base">{cohost.name}</span>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		</section>
	</div>

	<!-- Sticky pill nav -->
	<StickyNav sections={navSections} class="mx-auto max-w-4xl" />

	<!-- Context, one section per heading the Host wrote -->
	{#each contextSections as section (section.id)}
		<section id={section.id} class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
			<h2 class="font-display text-2xl font-medium md:text-3xl">{section.heading}</h2>
			<div class="mt-6 opacity-80 {HOST_COPY_PROSE_CLASS}">
				{@html section.html}
			</div>
		</section>
	{/each}

	<!-- What is an Open Poll? -->
	<section id="how-it-works" class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
		<h2 class="font-display text-2xl font-medium md:text-3xl">What is an "Open Poll"?</h2>
		<div class="mt-6 flex flex-col gap-7">
			{#each OPEN_POLL_EXPLAINER as paragraph, i (i)}
				<p class="font-sans text-base leading-6 font-medium opacity-80 md:text-lg md:leading-7">
					{paragraph}
				</p>
			{/each}
		</div>
	</section>

	<!-- Your Hosts. Dropped when a Campaign credits nobody, rather than
		standing in the catch-all's hosts. -->
	{#if cohosts.length > 0}
		<section id="your-host" class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
			<h2 class="font-display text-2xl font-medium md:text-3xl">Your Hosts</h2>
			<!-- The anchors are markup rather than an HTML string so a co-host's
				name and url are never interpolated into one. -->
			<p class="mt-6 font-sans text-base leading-6 font-medium opacity-80 md:text-lg">
				This Open Poll is hosted by {#each cohosts as cohost, i (cohost.name)}{#if cohost.url}<a
							href={safeHref(cohost.url)}
							target="_blank"
							rel="noopener noreferrer"
							class="text-destructive underline">{cohost.name}</a
						>{:else}{cohost.name}{/if}{listSeparator(i, cohosts.length)}{/each}.
			</p>
		</section>
	{/if}

	<!-- What's Next? -->
	<section id="whats-next" class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
		<h2 class="font-display text-2xl font-medium md:text-3xl">What's Next?</h2>
		<div class="mt-6 opacity-80 [&_a]:font-bold {HOST_COPY_PROSE_CLASS}">
			{@html renderHostCopy(hostCopy.whatsNext)}
		</div>
	</section>

	<!-- FAQ, hidden when empty -->
	{#if faq.length > 0}
		<section id="faq" class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
			<h2 class="font-display text-2xl font-medium md:text-3xl">Frequently Asked Questions</h2>
			<div class="mt-6">
				<Accordion items={faq} />
			</div>
		</section>
	{/if}

	<!-- Email signup. Reuses session.registerEmail flow — see ADR 0002. -->
	<section class="mx-auto max-w-4xl border-y border-stone-500/20 px-8 py-12">
		<div class="mx-auto flex max-w-md flex-col gap-4">
			<h2 class="text-center font-display text-3xl font-medium md:text-4xl">Stay in touch.</h2>
			{#if emailSuccess}
				<p
					class="text-center font-sans text-base leading-6 font-medium opacity-80 md:text-lg md:leading-7"
					in:fade={{ duration: 400, delay: 300 }}
				>
					<strong>Thanks — you're on the list.</strong>
				</p>
			{:else}
				<p
					class="text-center font-sans text-base leading-6 font-medium opacity-80 md:text-lg md:leading-7"
				>
					Share your email to receive updates on this conversation and more opportunities to share
					your voice on this issue.
				</p>
				<div class="flex flex-col gap-3.5">
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleEmailSignup();
						}}
						class="flex w-full items-center rounded-full bg-card px-5 py-3 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)]"
						class:ring-2={emailError}
						class:ring-destructive={emailError}
					>
						<Mail class="size-4 shrink-0 text-muted-foreground/60" />
						<Input
							bind:value={email}
							oninput={() => (emailError = '')}
							type="email"
							placeholder="email@xyz.com"
							disabled={emailSubmitting}
							class="ml-2.5 h-8 flex-1 rounded-none border-0 bg-transparent font-sans text-lg font-medium text-muted-foreground shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
						/>
					</form>
					{#if emailError}
						<p class="-mt-2 px-2 font-sans text-sm text-destructive">{emailError}</p>
					{/if}
					<Button
						variant="primary"
						fullWidth
						disabled={!email.trim() || emailSubmitting}
						onclick={handleEmailSignup}
					>
						{emailSubmitting ? 'SIGNING UP…' : 'SIGN UP FOR UPDATES'}
					</Button>
				</div>
			{/if}
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-primary px-8 py-12">
		<ul class="mx-auto flex max-w-4xl flex-col gap-1.5">
			{#each FOOTER_LINKS as link (link.label)}
				<li>
					<a
						href={link.href}
						target={link.external ? '_blank' : undefined}
						rel={link.external ? 'noopener noreferrer' : undefined}
						class="font-sans text-base leading-6 font-medium text-white hover:opacity-80 md:text-lg"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</footer>
</div>

<!-- The first frame of `/contribute`, drawn here so it is up on the click
	rather than after the join and navigation, and so the route swap underneath
	lands on the same pixels. -->
{#if leaving}
	<div class="fixed inset-0 z-50 bg-background" in:fade={{ duration: 120 }}>
		<AppShell border={false}>
			<VotingSkeleton {placeName} {question} />
		</AppShell>
		<span class="sr-only" role="status">Loading the poll</span>
	</div>
{/if}

<!-- The Host's own Context copy, the same `Conversation.description` the
	sections above render. It used to be `regions.ts`'s `aboutConversation`,
	which described The Bloom Project on every Campaign created in admin. -->
<Dialog bind:open={showAboutMessage} title="About This Conversation" buttonText="GOT IT">
	<div class="px-7 pt-6 {HOST_COPY_PROSE_CLASS}">
		{@html renderHostCopy(hostCopy.context)}
	</div>
</Dialog>

<Dialog
	bind:open={showTermsMessage}
	title="Our Approach to Personal Data"
	buttonText="I AGREE TO THESE TERMS"
	onButtonClick={handleAgreeToTos}
	requireScrollToBottom
>
	<div class="px-7 pt-6">
		<p class="font-sans text-lg leading-7 font-medium">
			We're here to run a community conversation, not collect data on you.
		</p>
		<ul class="mt-4 list-[square] pl-6 font-sans text-lg leading-7 font-medium">
			<li>
				<span class="font-bold"
					>We collect your responses and, if you choose, your contact info.</span
				> That's it.
			</li>
			<li>
				<span class="font-bold">You are in control.</span> You can access or delete your data at any
				time. Email us at
				<a href="mailto:hello@bloom-project.org">hello@bloom-project.org</a>.
			</li>
			<li><span class="font-bold">We never sell or monetize anything you share.</span></li>
			<li>
				<span class="font-bold"
					>OpenPoll results are public by design — so the whole community can see what people think.</span
				> Your responses are always anonymous.
			</li>
			<li>
				<span class="font-bold">Want to stay in the loop?</span> We'll share your contact info (email
				address) with the local organization(s) hosting this conversation so they can follow up about
				related opportunities.
			</li>
			<li>
				<span class="font-bold">We look at how people use the platform to make it better</span> — not
				to profile you or target you with ads.
			</li>
		</ul>
		<p class="mt-4 font-sans text-lg leading-7 font-medium">
			For more information, please view the full <a
				href="https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1"
				class="text-destructive underline"
				target="_blank"
				rel="noopener noreferrer">Privacy Policy.</a
			>
		</p>
	</div>
</Dialog>

<style>
	/* Smooth anchor scroll for in-page #context style links */
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
