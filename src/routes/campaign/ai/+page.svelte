<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { RegionConfig } from '$lib/config/regions';
	import { AppShell } from '$lib/components/layout';
	import { Button, Card } from '$lib/components/ui';
	import { Input } from '$lib/components/ui/input';
	import { session } from '$lib/services/session.svelte';
	import { Mail, MessageSquare } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	const region: RegionConfig = page.data.region;

	let email = $state('');
	let submitting = $state(false);
	let emailError = $state('');

	function handleJoinConversation() {
		goto('/');
	}

	function handleLearnMore() {
		// Add link to hosts page
		console.log('Learn more clicked');
	}

	function isValidEmail(value: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	// Build a comma-separated linked list of partners, ending with "and" — replaces the old
	// `region.fullHosts` HTML string. Order follows whatever the region config lists.
	const partnersHtml = (() => {
		const links = region.partners.map((p) => `<a href='${p.url}'>${p.name}</a>`);
		if (links.length === 0) return '';
		if (links.length === 1) return `${links[0]}.`;
		if (links.length === 2) return `${links[0]} and ${links[1]}.`;
		return `${links.slice(0, -1).join(', ')}, and ${links[links.length - 1]}.`;
	})();

	const emailHref = `mailto:?subject=${encodeURIComponent('Make your voice heard on the impact of AI. I did!')}&body=${encodeURIComponent(`Hi ___, I just filled out this short poll about managing AI impact in ${region.stateName} — it was fast, and it actually made me think. Since this stuff is going to affect all of us, I figured you might want to share your perspective too. Here's the link: ${region.shareUrl}`)}`;
	const smsHref = `sms:?body=${encodeURIComponent(`I just did this quick poll about managing AI in ${region.stateName}. It only took a couple of minutes — thought you might want to weigh in too. ${region.shareUrl}`)}`;

	async function handleSignUp() {
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
		submitting = true;
		await session.registerEmail(trimmed);
		session.emailProvided = true;
		submitting = false;
	}
</script>

{#snippet phaseIndicator(color: string)}
	<div class="mr-2 flex shrink-0 flex-col items-center pt-1">
		<div class="relative">
			<div
				class="pulse-ring absolute -inset-1 rounded-full bg-background/20"
				style="box-shadow: 0px 0px 15px 1px var(--{color})"
			></div>
			<div class="relative h-4 w-4 rounded-full" style="background-color: var(--{color})"></div>
		</div>
		<div
			class="w-0.5 flex-1"
			style="background: linear-gradient(to bottom, var(--{color}), transparent)"
		></div>
	</div>
{/snippet}

{#snippet inactiveIndicator()}
	<div class="absolute top-0 left-6 h-full w-0.5 bg-white/20"></div>
	<div class="absolute top-[22px] left-[17px] h-4 w-4 rounded-full bg-white/20"></div>
{/snippet}

<AppShell>
	<div class="flex h-full flex-col overflow-y-auto bg-gradient-primary">
		<!-- Header Bar -->
		<div class="flex items-center justify-between pt-3.75 pr-3.75 pb-2 pl-6 md:pr-8 md:pl-12">
			<div class="flex items-center gap-1.5">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="text-foreground/80"
				>
					<path
						d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
					/>
				</svg>
				<span class="font-mono text-sm font-medium text-foreground/70"
					>{region.stateName.toUpperCase()}</span
				>
			</div>
			<Button variant="soft" size="xs" href="/">TO OPEN POLL</Button>
		</div>

		<!-- Hero Section -->
		<div class="flex flex-col px-6 pt-6 pb-8 md:px-12">
			<span class="font-mono text-base font-medium text-muted-foreground uppercase">
				{region.stateName.toUpperCase()} Speaks
			</span>
			<h1
				class="mt-1 font-display text-5xl leading-[1.05] font-medium tracking-display text-muted-foreground"
			>
				AI and Our Future
			</h1>
			<p class="mt-5 font-sans text-lg leading-7 font-medium text-muted-foreground">
				A <strong>Community Solutions Assembly</strong> is bringing {region.demonym} together around the
				decisions that affect us all.
			</p>
			{#if region.campaignPageDescription}
				<p class="mt-5 font-sans text-lg leading-7 font-medium text-muted-foreground">
					{region.campaignPageDescription}
				</p>
			{/if}
			<p class="mt-5 font-sans text-lg leading-7 font-medium text-muted-foreground">
				Every perspective makes the picture more complete.
			</p>
		</div>

		<!-- What is this about? Section -->
		<!-- Your Hosts Section -->
		<div class="px-6 pb-8 md:px-12">
			<Card class="p-6">
				<span class="font-mono text-xs text-primary uppercase">WHO'S BEHIND THIS?</span>
				<h2
					class="mt-2 mb-4 font-display text-3xl leading-8 font-medium tracking-display text-muted-foreground"
				>
					Your Hosts
				</h2>
				<p class="text-md mb-6 font-sans leading-5 font-medium text-muted-foreground">
					{#if region.campaignPageHosts}
						{@html region.campaignPageHosts}
					{:else}
						Hosted by {@html partnersHtml}
					{/if}
				</p>
				<a href={region.hostUrl} target="_blank" rel="noopener noreferrer">
					<Button variant="primary" size="md" fullWidth>LEARN MORE</Button>
				</a>
			</Card>
		</div>

		<!-- Timeline Section -->
		<div class="px-6 py-10 md:px-12" style="background: var(--gradient-consensus)">
			<h2
				class="mb-2 text-center font-display text-4xl leading-9 font-medium tracking-display text-primary-foreground"
			>
				Timeline
			</h2>
			<p class="mb-8 text-center font-sans text-base leading-6 font-bold text-primary-foreground">
				Here's how the Solutions Assembly works — and how to get involved.
			</p>

			<!-- Phase 1: Our Views -->
			<div class="mb-6">
				<Card class="p-6">
					<div class="flex gap-3">
						<!-- Left indicator -->
						{@render phaseIndicator('destructive')}

						<!-- Content -->
						<div class="min-w-0 flex-1">
							<span class="font-mono text-xs font-medium text-destructive/70"
								>PHASE ONE ({region.phaseLabels?.phase1 ?? 'APRIL 2026'})</span
							>
							<h3
								class="mt-1 mb-3 font-display text-3xl leading-tight font-medium tracking-display text-muted-foreground"
							>
								Open Poll
							</h3>
							<p class="text-md mb-6 font-sans leading-5 font-medium text-muted-foreground">
								Share your thoughts in as little as 2 minutes on how artificial intelligence should
								be managed to benefit our communities. Vote on statements by other community members
								and add your own for consideration.
							</p>
							<Button href="/" variant="destructive" size="md" fullWidth>TAKE THE OPEN POLL</Button>
						</div>
					</div>
				</Card>
			</div>

			<!-- Phase 2: Listen & Learn -->
			<div class="mb-6">
				<Card class="p-6">
					<div class="flex gap-3">
						{@render phaseIndicator('destructive')}
						<div class="min-w-0 flex-1">
							<span class="font-mono text-xs font-medium text-destructive/70"
								>PHASE TWO ({region.phaseLabels?.phase2 ?? 'MAY 2026'})</span
							>
							<h3
								class="mt-1 mb-3 font-display text-3xl leading-tight font-medium tracking-display text-muted-foreground"
							>
								Community Conversations
							</h3>
							<p class="text-md mb-6 font-sans leading-5 font-medium text-muted-foreground">
								Join live conversations in-person or online to discuss what is actionable from the
								first phase and listen and learn with other community members.
							</p>
							<Button
								href={region.slug === 'utah'
									? 'https://www.utahcommonground.org/get-involved'
									: '/conversations?utm_source=campaign'}
								variant="destructive"
								size="md"
								fullWidth
							>
								JOIN A CONVERSATION
							</Button>
						</div>
					</div>
				</Card>
			</div>

			<!-- Phase 3: Decisions -->
			<Card class="relative overflow-hidden border-white/20 bg-white/10 pt-6 pr-6 pb-6 pl-12">
				{@render inactiveIndicator()}
				<span class="font-mono text-xs font-medium text-white/70"
					>PHASE THREE ({region.phaseLabels?.phase3 ?? 'SEPTEMBER 2026'})</span
				>
				<h3
					class="mt-1 mb-3 font-display text-3xl leading-tight font-medium tracking-display text-white"
				>
					Solutions Forum
				</h3>
				<p class="text-md mb-6 font-sans leading-5 font-medium text-white">
					Interested residents, selected by lottery to represent all walks of life in {region.stateName},
					will work together to prioritize the top policies and practices the region should pursue.
				</p>
				<Button
					size="md"
					class="border border-white/10 bg-white/20 text-white"
					variant="gradient"
					fullWidth
					disabled
				>
					REGISTRATIONS TBA
				</Button>
			</Card>
		</div>

		<!-- Email Signup Section -->
		<div class="bg-card/30 px-6 py-8 md:px-12">
			<div class="mx-auto flex max-w-md flex-col gap-4">
				{#if session.emailProvided}
					<p
						class="text-center font-sans text-base leading-6 text-muted-foreground"
						in:fade={{ duration: 400, delay: 300 }}
					>
						<strong>Received! We'll be in touch.</strong>
					</p>
				{:else}
					<p class="text-center font-sans text-base leading-6 text-muted-foreground">
						Receive updates on this assembly and opportunities to get involved at every stage.
					</p>
					<div class="flex flex-col gap-3.5">
						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleSignUp();
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
								disabled={submitting}
								class="ml-2.5 h-8 flex-1 rounded-none border-0 bg-transparent font-sans text-lg font-medium text-muted-foreground shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
							/>
						</form>
						{#if emailError}
							<p class="-mt-2 px-2 font-sans text-sm text-destructive">{emailError}</p>
						{/if}
						<Button
							variant="primary"
							fullWidth
							disabled={!email.trim() || submitting}
							onclick={handleSignUp}
						>
							SIGN UP FOR UPDATES
						</Button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Tell Your Friends Section -->
		<div class="bg-white/30 px-6 py-10 md:px-12">
			<div class="flex flex-col gap-4">
				<h2
					class="font-display text-3xl leading-8 font-medium tracking-display text-muted-foreground"
				>
					Tell your friends
				</h2>
				<p class="font-sans text-lg leading-7 font-medium text-muted-foreground">
					The more input we have from our fellow Central Oregonians, the better our results will be.
					Please take a moment to call, text or email your friends and neighbors asking them to
					share their thoughts on this important issue with us.
				</p>
				<div class="flex flex-col gap-3 sm:flex-row">
					<Button href={emailHref} variant="primary" size="md" fullWidth class="gap-2">
						<Mail class="size-4 shrink-0" />
						EMAIL A FRIEND
					</Button>
					<Button href={smsHref} variant="primary" size="md" fullWidth class="gap-2">
						<MessageSquare class="size-4 shrink-0" />
						TEXT A FRIEND
					</Button>
				</div>
			</div>
		</div>
	</div>
</AppShell>

<style>
	.pulse-ring {
		animation: phase-pulse 2s ease-out infinite;
	}
	@keyframes phase-pulse {
		0% {
			transform: scale(0);
			opacity: 1;
		}
		80%,
		100% {
			transform: scale(2.5);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse-ring {
			animation: none;
			transform: scale(1.5);
			opacity: 0.2;
		}
	}
</style>
