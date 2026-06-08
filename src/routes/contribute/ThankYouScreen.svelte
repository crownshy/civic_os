<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		InfoBar,
		EmojiCircle,
		ActionPanel,
		EmailPanelContent,
		SharePanelContent,
		ReviewPanelContent
	} from '$lib/components/ui';
	import { session } from '$lib/services/session.svelte';
	import { ArrowRight, Check } from 'lucide-svelte';
	import type { RegionConfig } from '$lib/config/regions';

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

	function openReview() {
		reviewPanelOpen = true;
		// Spec: also mark on open as a weak fallback. A real Heyform submission
		// postMessage (handled inside ReviewPanelContent) is idempotent.
		session.markEndCtaReviewCompleted();
	}

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
	<EmailPanelContent
		umamiSubmitEvent="end-email-submit"
		onComplete={() => (emailPanelOpen = false)}
	/>
</ActionPanel>

<!-- Share panel -->
<ActionPanel
	bind:open={sharePanelOpen}
	title="Help bring everyone into the fold."
	umamiDismissEvent="end-panel-dismiss-share"
>
	<SharePanelContent
		{region}
		umamiTextEvent="end-share-text"
		umamiEmailEvent="end-share-email"
		umamiLinkEvent="end-share-link"
		onComplete={() => (sharePanelOpen = false)}
	/>
</ActionPanel>

<!-- Review panel -->
<ActionPanel
	bind:open={reviewPanelOpen}
	title="Rate your experience."
	description="Tell us what worked, what didn’t, and what would make this better."
	umamiDismissEvent="end-panel-dismiss-review"
	class="md:w-[560px]"
>
	<ReviewPanelContent umamiSubmitEvent="end-review-submit" />
</ActionPanel>
