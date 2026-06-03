<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Button, Dialog, ZipInput, Accordion, StickyNav } from '$lib/components/ui';
	import { Mail } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import { session } from '$lib/services/session.svelte';
	import { getRegionByZipcode, getRegionUrl, REGIONS } from '$lib/config/regions';
	import type { RegionConfig } from '$lib/config/regions';
	import { OPEN_POLL_EXPLAINER, FOOTER_LINKS } from '$lib/config/landing-copy';
	import { trackEvent } from '@lukulent/svelte-umami';

	const region: RegionConfig = page.data.region;
	const isReturning = session.hasSession;

	// --- Join (zip → /contribute) state ---
	let zipCode = $state(isReturning ? session.zipCode : '');
	let hasZip = $derived(!!zipCode.trim());
	let joining = $state(false);
	let zipFlash = $state(false);
	let hasAgreedToTos = $derived(session.hasAgreedToTos);
	let showHostMessage = $state(false);
	let showAboutMessage = $state(false);
	let showTermsMessage = $state(false);

	// --- Email signup (bottom of page) state ---
	let email = $state('');
	let emailSubmitting = $state(false);
	let emailError = $state('');
	let emailSuccess = $state(false);

	// Pick up zip from URL on mount (used when redirecting between region subdomains)
	onMount(() => {
		if (browser && !isReturning) {
			const params = new URLSearchParams(window.location.search);
			const zipParam = params.get('zip_code');
			if (zipParam) zipCode = zipParam;
		}
	});

	function showTermsModal() {
		trackEvent('ShownTermsModal');
		showTermsMessage = true;
	}

	function handleAgreeToTos() {
		trackEvent('AgreedToTerms');
		session.setSessionField('hasAgreedToTos', true);
		handleJoin();
	}

	async function handleJoin() {
		if (isReturning) {
			goto('/contribute');
			return;
		}

		// LOCAL DEV: when dev region is registered, force every zip to land on dev.
		// In prod, route by zipcode prefix. See regions.ts for details.
		const zipRegion = REGIONS.dev ? REGIONS.dev : getRegionByZipcode(zipCode.trim());

		// Different region than current subdomain → redirect.
		if (zipRegion.slug !== region.slug) {
			// Redirect to the appropriate subdomain with zipcode parameter
			trackEvent('UnsupportedZipCode', {
				zipCode,
				regionSlug: region.slug,
				zipRegion: zipRegion.slug
			});
			const redirectUrl = getRegionUrl(zipRegion, zipCode.trim(), window.location.hostname);
			window.location.href = redirectUrl;
			return;
		}

		joining = true;
		const success = await session.join(
			zipCode.trim(),
			undefined,
			zipRegion.conversationId,
			zipRegion.inviteId
		);
		joining = false;
		trackEvent('SucccesfullSignup');
		if (success) goto('/contribute');
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
		// If user already has a session, just register the email against it.
		// Otherwise, create a minimal session (no zip) so registerEmail has a conversationId.
		if (session.hasSession) {
			await session.registerEmail(trimmed);
		} else {
			await session.join('', trimmed, region.conversationId, region.inviteId);
		}
		emailSubmitting = false;
		emailSuccess = true;
	}

	// Comma-separated list of partner names with "and" before the last — fallback
	// rendering for the Your Hosts section while logo carousel is deferred.
	const partnersText = (() => {
		const links = region.partners.map(
			(p) =>
				`<a href='${p.url}' target='_blank' rel='noopener noreferrer' class='underline'>${p.name}</a>`
		);
		if (links.length === 0) return '';
		if (links.length === 1) return links[0];
		if (links.length === 2) return `${links[0]} and ${links[1]}`;
		return `${links.slice(0, -1).join(', ')}, and ${links[links.length - 1]}`;
	})();
</script>

<svelte:head>
	<title>{region.heroHeader} — {region.stateName}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 text-yellow-950">
	<!-- Header chip row — bypasses AppShell. See docs/adr/0001-landing-bypasses-appshell.md -->
	<header class="flex items-center justify-between px-6 pt-4 pb-2">
		<div class="flex items-center gap-2 font-mono text-sm font-medium text-stone-500 uppercase">
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
			{region.stateName.toUpperCase()}
		</div>
		<button
			type="button"
			onclick={() => (showAboutMessage = true)}
			class="rounded-[20px] bg-yellow-600/10 px-2 py-0.5 font-mono text-sm font-medium text-stone-500 hover:bg-yellow-600/20"
		>
			ABOUT→
		</button>
	</header>

	<!-- Hero -->
	<section id="join" class="mx-auto max-w-4xl scroll-mt-24 px-6 pt-4 pb-10">
		<div class="flex justify-center">
			<span
				class="rounded-[30px] bg-yellow-950 px-3.5 py-2 font-mono text-sm font-medium text-white"
			>
				OPEN POLL
			</span>
		</div>
		<h1 class="mt-6 text-center font-display text-5xl leading-[1.05] font-medium tracking-display">
			{region.heroHeader}
		</h1>
		<p class="mt-6 text-center font-sans text-base leading-5 font-medium">
			{@html region.heroBlurb}
		</p>

		<div class="mt-10 flex flex-col items-center">
			<span class="font-display text-base font-medium opacity-80">Your location</span>
			<div class="mt-1.5 w-full max-w-sm">
				<ZipInput
					bind:value={zipCode}
					disabled={isReturning}
					bind:flash={zipFlash}
					regionPrefixes={region.zipPrefixes}
				/>
			</div>
			<Button
				variant="primary"
				fullWidth
				disabled={joining}
				onclick={() => {
					if (!hasZip) {
						zipFlash = true;
						return;
					}
					if (hasAgreedToTos) handleJoin();
					else showTermsModal();
				}}
				class="mt-4 max-w-sm"
			>
				{isReturning ? 'CONTINUE' : 'JOIN THE CONVERSATION'}
			</Button>
		</div>

		<!-- Hosted by strip — partner logos deferred. Renders linked names until logo URLs
		     land on RegionConfig.partners[].logo. See landing redesign follow-ups. -->
		{#if region.partners.length > 0}
			<div class="mt-10 flex flex-col items-center gap-3">
				<span class="font-display text-base font-medium opacity-80">Hosted by</span>
				<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-center">
					<!-- TODO: add logos -->
					{#each region.partners as partner (partner.url)}
						{#if partner.logo}
							<a href={partner.url} target="_blank" rel="noopener noreferrer">
								<img
									src={partner.logo}
									alt={partner.name}
									class="h-8 max-w-[120px] object-contain"
								/>
							</a>
						{:else}
							<a
								href={partner.url}
								target="_blank"
								rel="noopener noreferrer"
								class="font-sans text-sm font-medium underline"
							>
								{partner.name}
							</a>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</section>

	<!-- Sticky pill nav -->
	<StickyNav class="mx-auto max-w-4xl" />

	<!-- Context -->
	<section id="context" class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
		<h2 class="font-display text-2xl font-medium">Context</h2>
		<div class="mt-6 flex flex-col gap-7">
			{#each region.contextParagraphs as paragraph, i (i)}
				<p class="font-sans text-base leading-6 font-medium opacity-80">{@html paragraph}</p>
			{/each}
		</div>
	</section>

	<!-- What is an Open Poll? -->
	<section id="how-it-works" class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
		<h2 class="font-display text-2xl font-medium">What is an "Open Poll"?</h2>
		<div class="mt-6 flex flex-col gap-7">
			{#each OPEN_POLL_EXPLAINER as paragraph, i (i)}
				<p class="font-sans text-base leading-6 font-medium opacity-80">{paragraph}</p>
			{/each}
		</div>
	</section>

	<!-- Your Hosts -->
	<section id="your-host" class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
		<h2 class="font-display text-2xl font-medium">Your Hosts</h2>
		<p class="mt-6 font-sans text-base leading-6 font-medium opacity-80">
			{@html region.hostsBlurb}
		</p>
		{#if partnersText}
			<p class="mt-4 font-sans text-sm leading-6 font-medium opacity-70">
				Your local hosts: {@html partnersText}.
			</p>
		{/if}
	</section>

	<!-- What's Next? -->
	<section id="whats-next" class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
		<h2 class="font-display text-2xl font-medium">What's Next?</h2>
		<p class="mt-6 font-sans text-base leading-6 font-medium opacity-80">
			{@html region.whatsNext}
		</p>
	</section>

	<!-- FAQ — hide when empty -->
	{#if region.faq.length > 0}
		<section id="faq" class="mx-auto max-w-4xl scroll-mt-24 px-8 py-5">
			<h2 class="font-display text-2xl font-medium">Frequently Asked Questions</h2>
			<div class="mt-6">
				<Accordion items={region.faq} />
			</div>
		</section>
	{/if}

	<!-- Email signup. Reuses session.registerEmail flow — see ADR 0002. -->
	<section class="mx-auto max-w-4xl border-y border-stone-500/20 px-8 py-12">
		<div class="mx-auto flex max-w-md flex-col gap-4">
			<h2 class="text-center font-display text-3xl font-medium">Stay in touch.</h2>
			{#if emailSuccess}
				<p
					class="text-center font-sans text-base leading-6 font-medium opacity-80"
					in:fade={{ duration: 400, delay: 300 }}
				>
					<strong>Thanks — you're on the list.</strong>
				</p>
			{:else}
				<p class="text-center font-sans text-base leading-6 font-medium opacity-80">
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
						class="font-sans text-base leading-6 font-medium text-white hover:opacity-80"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</footer>
</div>

<!-- Loading overlay during join -->
{#if joining}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-linear-to-b from-orange-50 to-orange-100"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="h-10 w-10 animate-spin rounded-full border-4 border-yellow-950/30 border-t-yellow-950"
		></div>
		<span class="mt-4 font-mono text-sm font-medium text-yellow-950/80 uppercase">JOINING…</span>
	</div>
{/if}

<!-- Dialogs preserved from previous /landing -->
<Dialog bind:open={showHostMessage} title="A Message from Your Hosts" buttonText="GO BACK">
	<div class="px-7 pt-6">
		{#each region.hostMessage as paragraph, i (i)}
			<p class="mt-4 font-sans text-lg leading-7 font-medium first:mt-0">
				{@html paragraph}
			</p>
		{/each}
	</div>
</Dialog>

<Dialog bind:open={showAboutMessage} title="About This Conversation" buttonText="GOT IT">
	<div class="px-7 pt-6">
		{#each region.aboutConversation as paragraph, i (i)}
			<p class="mt-4 font-sans text-lg leading-7 font-medium first:mt-0">
				{@html paragraph}
			</p>
		{/each}
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
