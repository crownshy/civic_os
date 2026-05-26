<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { InfoBar, Button, EmojiCircle, ActionPanel } from '$lib/components/ui';
	import { Input } from '$lib/components/ui/input';
	import { session } from '$lib/services/session.svelte';
	import { ArrowRight, Check, Mail, MessageSquare, Link as LinkIcon } from 'lucide-svelte';
	import type { RegionConfig } from '$lib/config/regions';
	import { isValidEmail } from '$lib/utils/forms';

	// TODO: replace with the real Heyform embed URL once provided.
	const HEYFORM_EMBED_URL = 'https://forms.bloomproject.us/form/6mdAdmis';

	// TODO(post-#216): import from '$lib/config/landing-copy' once branch 216 lands.
	const FOOTER_LINKS: { label: string; href: string; external?: boolean }[] = [
		{ label: 'Take the Open Poll', href: '/contribute' },
		{ label: 'Join a Community Conversation', href: '/conversations' },
		{ label: 'About BLOOM Project', href: 'https://www.bloom-project.org/', external: true },
		{
			label: 'Terms and Conditions',
			href: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1',
			external: true
		},
		{
			label: 'Privacy Policy',
			href: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1',
			external: true
		}
	];

	interface Props {
		countyName: string;
		region: RegionConfig;
		onBackToVoting?: () => void;
	}

	let { countyName, onBackToVoting, region }: Props = $props();

	let emailPanelOpen = $state(false);
	let sharePanelOpen = $state(false);
	let reviewPanelOpen = $state(false);

	let email = $state('');
	let submittingEmail = $state(false);
	let emailError = $state('');

	let linkCopied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	async function handleEmailSubmit() {
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
		submittingEmail = true;
		await session.registerEmail(trimmed);
		session.emailProvided = true;
		submittingEmail = false;
		emailPanelOpen = false;
	}

	const shareSubject = $derived(`Have your say about AI in ${region.stateName}`);
	const shareBody = $derived(
		`I just shared what I think about how ${region.demonym} should approach AI. Add your voice: ${region.shareUrl}`
	);

	function shareViaText() {
		window.location.href = `sms:?&body=${encodeURIComponent(shareBody)}`;
		session.markEndCtaShareCompleted();
		sharePanelOpen = false;
	}

	function shareViaEmail() {
		window.location.href = `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody)}`;
		session.markEndCtaShareCompleted();
		sharePanelOpen = false;
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(region.shareUrl);
		} catch {
			/* clipboard may be blocked; we still mark complete because intent was clear */
		}
		linkCopied = true;
		session.markEndCtaShareCompleted();
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => {
			linkCopied = false;
		}, 2000);
	}

	function openReview() {
		reviewPanelOpen = true;
		// Spec: mark completed on open as the fallback signal. A real postMessage
		// from Heyform (when its embed URL is configured) will also fire below,
		// which is idempotent.
		session.markEndCtaReviewCompleted();
	}

	onMount(() => {
		function handleMessage(event: MessageEvent) {
			// Heyform posts messages from its own origin when a form is submitted.
			// Shape isn't fully documented across versions, so we accept either a
			// string sentinel or an object with a recognizable type.
			const data = event.data;
			const isHeyformSubmit =
				(typeof data === 'string' &&
					data.toLowerCase().includes('heyform') &&
					data.includes('submit')) ||
				(typeof data === 'object' &&
					data !== null &&
					'type' in data &&
					typeof (data as { type: unknown }).type === 'string' &&
					((data as { type: string }).type.startsWith('heyform') ||
						(data as { type: string }).type.includes('form-submit')));
			if (isHeyformSubmit) {
				session.markEndCtaReviewCompleted();
			}
		}
		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
			clearTimeout(copyTimer);
		};
	});

	const emailDone = $derived(session.emailProvided);
	const shareDone = $derived(session.endCtaShareCompleted);
	const reviewDone = $derived(session.endCtaReviewCompleted);
</script>

<div
	class="flex h-full flex-col bg-gradient-to-b from-orange-50 to-orange-100 text-yellow-950"
	in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}
>
	<div class="flex flex-1 flex-col overflow-y-auto">
		<InfoBar {region} {countyName} onBack={onBackToVoting} />

		<!-- Hero -->
		<div class="flex flex-col items-center px-8 pt-14">
			<EmojiCircle emoji="🎉" size="lg" />
			<h1
				class="mt-6 text-center font-display text-4xl leading-10 font-medium tracking-display text-foreground"
			>
				Thank you!
			</h1>
			<p class="mt-2 text-center font-sans text-base leading-6 font-medium text-secondary/80">
				Your perspectives will shape the conversations that come next. What you can do now:
			</p>
		</div>

		<!-- CTA cards -->
		<div class="mx-auto mt-6 grid w-full max-w-4xl grid-cols-1 gap-3.5 px-7 md:grid-cols-2">
			<a
				href="/conversations"
				data-umami-event="end-cta-join-click"
				class="group flex flex-col gap-2 rounded-[30px] bg-gradient-to-b from-card to-card/70 p-6 shadow-[0px_4px_24px_rgba(134,101,73,0.20)] transition-transform hover:scale-[1.01]"
			>
				<div class="flex items-center gap-2">
					<span
						class="flex-1 font-display text-2xl leading-7 font-medium tracking-display text-card-foreground"
						>Join a Conversation.</span
					>
					<ArrowRight class="size-5 text-destructive opacity-80" />
				</div>
				<p class="font-sans text-sm leading-4 font-medium text-secondary/80">
					{region.endCtaJoinDescription}
				</p>
			</a>

			<button
				type="button"
				data-umami-event="end-cta-email-click"
				onclick={() => (emailPanelOpen = true)}
				class={[
					'group flex flex-col gap-2 rounded-[30px] bg-gradient-to-b from-card to-card/70 p-6 text-left shadow-[0px_4px_24px_rgba(134,101,73,0.20)] transition-all hover:scale-[1.01]',
					emailDone && 'opacity-60'
				]}
			>
				<div class="flex items-center gap-2">
					<span
						class="flex-1 font-display text-2xl leading-7 font-medium tracking-display text-card-foreground"
						>Get on the email list.</span
					>
					{#if emailDone}
						<Check class="size-5 text-primary" />
					{:else}
						<ArrowRight class="size-5 text-destructive opacity-80" />
					{/if}
				</div>
				<p class="font-sans text-sm leading-4 font-medium text-secondary/80">
					Share your email to receive more updates on opportunities related to this conversation.
				</p>
			</button>

			<button
				type="button"
				data-umami-event="end-cta-share-click"
				onclick={() => (sharePanelOpen = true)}
				class="group flex flex-col gap-2 rounded-[30px] bg-linear-to-b from-card to-card/70 p-6 text-left shadow-[0px_4px_24px_rgba(134,101,73,0.20)] transition-all hover:scale-[1.01]"
			>
				<div class="flex items-center gap-2">
					<span
						class="flex-1 font-display text-2xl leading-7 font-medium tracking-display text-card-foreground"
						>Share with community.</span
					>
					{#if shareDone}
						<Check class="size-5 text-primary" />
					{:else}
						<ArrowRight class="size-5 text-destructive opacity-80" />
					{/if}
				</div>
				<p class="font-sans text-sm leading-4 font-medium text-secondary/80">
					{region.endCtaShareDescription}
				</p>
			</button>

			<button
				type="button"
				data-umami-event="end-cta-review-click"
				onclick={openReview}
				class="group flex flex-col gap-2 rounded-[30px] bg-gradient-to-b from-card to-card/70 p-6 text-left shadow-[0px_4px_24px_rgba(134,101,73,0.20)] transition-all hover:scale-[1.01]"
			>
				<div class="flex items-center gap-2">
					<span
						class="flex-1 font-display text-2xl leading-7 font-medium tracking-display text-card-foreground"
						>Leave a review.</span
					>
					{#if reviewDone}
						<Check class="size-5 text-primary" />
					{:else}
						<ArrowRight class="size-5 text-destructive opacity-80" />
					{/if}
				</div>
				<p class="font-sans text-sm leading-4 font-medium text-secondary/80">
					Let us know your honest thoughts and ideas about this experience – we read every word.
				</p>
			</button>
		</div>

		<!-- What comes next -->
		<div class="mx-auto mt-10 w-full max-w-4xl px-7 pb-10">
			<h2 class="font-display text-2xl leading-9 font-medium tracking-display text-yellow-950">
				What comes next?
			</h2>
			<div
				class="mt-2 font-sans text-base leading-6 font-normal text-yellow-950 [&_a]:font-bold [&_a]:text-destructive [&_a]:underline"
			>
				<p>{@html region.whatsNext}</p>
				<p class="mt-4">{@html region.goDeeper}</p>
			</div>
		</div>

		<!-- Footer (mirrors landing page on branch 216; dedupe once that branch merges) -->
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
</div>

<!-- Email panel -->
<ActionPanel
	bind:open={emailPanelOpen}
	title={emailDone ? "You're on the list." : 'Stay in touch.'}
	description={emailDone
		? 'Thanks — we’ll be in touch with updates on this conversation.'
		: 'Share your email to receive updates on this conversation and opportunities to share your voice on this issue.'}
	umamiDismissEvent="end-panel-dismiss-email"
>
	{#if emailDone}
		<div in:fade={{ duration: 300 }} class="flex flex-col items-center py-3">
			<div class="flex size-14 items-center justify-center rounded-full bg-primary/10">
				<Check class="size-7 text-primary" />
			</div>
		</div>
	{:else}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleEmailSubmit();
			}}
			class="flex flex-col gap-3"
		>
			<div
				class="flex w-full items-center rounded-full bg-card px-5 py-3 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)]"
				class:ring-2={emailError}
				class:ring-destructive={emailError}
			>
				<Mail class="size-4 shrink-0 text-secondary/60" />
				<Input
					bind:value={email}
					oninput={() => (emailError = '')}
					type="email"
					placeholder="email@xyz.com"
					disabled={submittingEmail}
					class="ml-2.5 h-8 flex-1 rounded-none border-0 bg-transparent font-sans text-lg font-medium text-foreground/80 shadow-none placeholder:text-foreground/50 focus-visible:ring-0"
				/>
			</div>
			{#if emailError}
				<p class="-mt-1 px-2 font-sans text-sm text-destructive">{emailError}</p>
			{/if}
			<Button
				variant="primary"
				fullWidth
				disabled={!email.trim() || submittingEmail}
				onclick={handleEmailSubmit}
				data-umami-event="end-email-submit"
			>
				SIGN UP FOR UPDATES
			</Button>
		</form>
	{/if}
</ActionPanel>

<!-- Share panel -->
<ActionPanel
	bind:open={sharePanelOpen}
	title="Help bring everyone into the fold."
	umamiDismissEvent="end-panel-dismiss-share"
>
	<div class="flex justify-around pt-2">
		<button
			type="button"
			data-umami-event="end-share-text"
			onclick={shareViaText}
			class="flex flex-col items-center gap-2"
		>
			<span
				class="flex size-16 items-center justify-center rounded-full bg-secondary/10 transition-colors hover:bg-secondary/20"
			>
				<MessageSquare class="size-7 text-secondary" />
			</span>
			<span class="font-mono text-sm font-medium text-secondary/70">TEXT</span>
		</button>

		<button
			type="button"
			data-umami-event="end-share-email"
			onclick={shareViaEmail}
			class="flex flex-col items-center gap-2"
		>
			<span
				class="flex size-16 items-center justify-center rounded-full bg-secondary/10 transition-colors hover:bg-secondary/20"
			>
				<Mail class="size-7 text-secondary" />
			</span>
			<span class="font-mono text-sm font-medium text-secondary/70">EMAIL</span>
		</button>

		<button
			type="button"
			data-umami-event="end-share-link"
			onclick={copyLink}
			class="flex flex-col items-center gap-2"
		>
			<span
				class="flex size-16 items-center justify-center rounded-full bg-secondary/10 transition-colors hover:bg-secondary/20"
			>
				{#if linkCopied}
					<Check class="size-7 text-primary" />
				{:else}
					<LinkIcon class="size-7 text-secondary" />
				{/if}
			</span>
			<span class="font-mono text-sm font-medium text-secondary/70">
				{linkCopied ? 'COPIED!' : 'LINK'}
			</span>
		</button>
	</div>
</ActionPanel>

<!-- Review panel -->
<ActionPanel
	bind:open={reviewPanelOpen}
	title="Rate your experience."
	description="Tell us what worked, what didn’t, and what would make this better."
	umamiDismissEvent="end-panel-dismiss-review"
	class="md:w-[560px]"
>
	<div class="-mx-7 -mb-2 h-[420px] md:mx-0 md:h-[480px]">
		<iframe
			src={HEYFORM_EMBED_URL}
			title="Leave a review"
			class="size-full border-0"
			data-umami-event="end-review-submit"
		></iframe>
	</div>
</ActionPanel>
