<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { RegionConfig } from '$lib/config/regions';
	import { AppShell } from '$lib/components/layout';
	import { Button, Badge, Card } from '$lib/components/ui';
	import { Input } from '$lib/components/ui/input';
	import { session } from '$lib/services/session.svelte';
	import { Mail, MapPin } from 'lucide-svelte';
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
	<div class="flex flex-col mr-2 items-center shrink-0 pt-1">
		<div class="relative">
			<div class="absolute -inset-1 rounded-full bg-background/20 pulse-ring" style="box-shadow: 0px 0px 15px 1px var(--{color})"></div>
			<div class="relative w-4 h-4 rounded-full" style="background-color: var(--{color})"></div>
		</div>
		<div class="w-0.5 flex-1" style="background: linear-gradient(to bottom, var(--{color}), transparent)"></div>
	</div>
{/snippet}

{#snippet inactiveIndicator()}
	<div class="absolute left-6 top-0 w-0.5 h-full bg-white/20"></div>
	<div class="absolute left-[17px] top-[22px] w-4 h-4 rounded-full bg-white/20"></div>
{/snippet}

<AppShell>
	<div class="flex flex-col bg-gradient-primary h-full overflow-y-auto">
		<!-- Header Bar -->
		<div class="flex items-center justify-between pl-6 pr-3.75 pt-3.75 pb-2 md:pl-12 md:pr-8">
			<div class="flex items-center gap-1.5">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-foreground/80">
					<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
				</svg>
				<span class="font-mono text-sm font-medium text-foreground/70">{region.stateName.toUpperCase()}</span>
			</div>
			<Button variant="soft" size="xs" href="/">
			  TO OPEN POLL	
			</Button>
		</div>

		<!-- Hero Section -->
		<div class="flex flex-col px-6 md:px-12 pt-6 pb-8">
			<span class="font-mono text-base font-medium uppercase text-muted-foreground">
			  {region.stateName.toUpperCase()} Speaks	
			</span>
			<h1 class="mt-1 font-sans text-5xl font-extrabold leading-[1.05] text-muted-foreground">
			  AI and Our Future
			</h1>
			<p class="mt-5 font-sans text-lg font-medium leading-7 text-muted-foreground">
				A <strong>Community Solutions Assembly</strong> bringing {region.demonym} together around the decisions that affect us all.
			</p>
			{#if region.campaignPageDescription}
				<p class="mt-5 font-sans text-lg font-medium leading-7 text-muted-foreground">
					{region.campaignPageDescription}
				</p>
			{/if}
			<p class="mt-5 font-sans text-lg font-medium leading-7 text-muted-foreground">
				Every perspective makes the picture more complete.
			</p>

		</div>


		<!-- What is this about? Section -->
		<!-- Your Hosts Section -->
		<div class="px-6 md:px-12 pb-8">
			<Card class="p-6">
				<span class="font-mono text-xs uppercase text-primary">WHO'S BEHIND THIS?</span>
				<h2 class="font-sans text-3xl font-bold text-muted-foreground leading-8 mt-2 mb-4">
					Your Hosts
				</h2>
					<p class="font-sans text-md font-medium text-muted-foreground leading-5 mb-6">
					{#if region.campaignPageHosts}
						{@html region.campaignPageHosts}
					{:else}
						Hosted by {@html region.fullHosts}
					{/if}
				</p>
				<a href={region.hostUrl} target="_blank" rel="noopener noreferrer">
				  <Button variant="primary" size="md" fullWidth >
					  LEARN MORE
				  </Button>
				</a>
			</Card>
		</div>

		<!-- Timeline Section -->
		<div class="py-10 px-6 md:px-12" style="background: var(--gradient-consensus)">
			<h2 class="font-sans text-4xl font-bold text-primary-foreground text-center leading-9 mb-2">
				Timeline
			</h2>
			<p class="font-sans text-base font-bold text-primary-foreground text-center leading-6 mb-8">
			  Here's how the Solutions Assembly works — and how to get involved.	
			</p>

			<!-- Phase 1: Our Views -->
			<div class="mb-6">
				<Card class="p-6">
					<div class="flex gap-3">
						<!-- Left indicator -->
						{@render phaseIndicator('destructive')}


						<!-- Content -->
						<div class="flex-1 min-w-0">
							<span class="font-mono text-xs font-medium text-destructive/70">PHASE ONE ({region.phaseLabels?.phase1 ?? 'APRIL 2026'})</span>
							<h3 class="font-sans text-3xl font-bold leading-tight mt-1 mb-3 text-muted-foreground">Open Poll</h3>
							<p class="font-sans text-md font-medium leading-5 mb-6 text-muted-foreground">
							  Share your thoughts in as little as 2 minutes on how artificial intelligence should be managed to benefit our communities, and see what fellow community members think.
							</p>
							<Button href='/' variant="destructive" size="md" fullWidth>
								JOIN CONVERSATION
							</Button>
						</div>
					</div>
				</Card>
			</div>

			<!-- Phase 2: Listen & Learn -->
			<div class="mb-6">
				<Card class="p-6">
					<div class="flex gap-3">
						{@render phaseIndicator('destructive')}
						<div class="flex-1 min-w-0">
							<span class="font-mono text-xs font-medium text-destructive/70">PHASE TWO ({region.phaseLabels?.phase2 ?? 'MAY 2026'})</span>
							<h3 class="font-sans text-3xl font-bold leading-tight mt-1 mb-3 text-muted-foreground">Community Conversations</h3>
							<p class="font-sans text-md font-medium leading-5 mb-6 text-muted-foreground">
							  Join live conversations in-person or online to discuss what is actionable from the first phase and listen and learn with other community members.
							</p>
							<Button variant="destructive" size="md" fullWidth>
								SIGN UP
							</Button>
						</div>
					</div>
				</Card>
			</div>

			<!-- Phase 3: Decisions -->
			<Card class="relative bg-white/10 border-white/20 overflow-hidden pt-6 pr-6 pb-6 pl-12">
				{@render inactiveIndicator()}
				<span class="font-mono text-xs font-medium text-white/70">PHASE THREE ({region.phaseLabels?.phase3 ?? 'SEPTEMBER 2026'})</span>
				<h3 class="font-sans text-3xl font-bold leading-tight mt-1 mb-3 text-white">Solutions Forum</h3>
				<p class="font-sans text-md font-medium leading-5 mb-6 text-white">
				  30 residents, selected by lottery to represent all walks of life in {region.stateName}, will work together over a long weekend to prioritize the top policies and practices  the region should pursue.
				</p>
				<Button size="md" class='text-white bg-white/20 border border-white/10' variant="gradient" fullWidth disabled>
					REGISTRATIONS TBA
				</Button>
			</Card>
		</div>

		<!-- Email Signup Section -->
		<div class="bg-card/30 py-8 px-6 md:px-12">
			<div class="flex flex-col gap-4 max-w-md mx-auto">
				{#if session.emailProvided}
					<p class="font-sans text-base text-muted-foreground leading-6 text-center" in:fade={{ duration: 400, delay: 300 }}>
						<strong>Received! We'll be in touch.</strong>
					</p>
				{:else}
					<p class="font-sans text-base text-muted-foreground leading-6 text-center">
					  Receive updates on this assembly and opportunities to get involved at every stage.
					</p>
					<div class="flex flex-col gap-3.5">
						<form
							onsubmit={(e) => { e.preventDefault(); handleSignUp(); }}
							class="flex w-full items-center rounded-full bg-card px-5 py-3 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)]"
							class:ring-2={emailError}
							class:ring-destructive={emailError}
						>
							<Mail class="text-muted-foreground/60 size-4 shrink-0" />
							<Input
								bind:value={email}
								oninput={() => emailError = ''}
								type="email"
								placeholder="email@xyz.com"
								disabled={submitting}
								class="ml-2.5 flex-1 h-8 rounded-none border-0 bg-transparent font-sans text-lg font-medium text-muted-foreground placeholder:text-muted-foreground/50 shadow-none focus-visible:ring-0"
							/>
						</form>
						{#if emailError}
							<p class="-mt-2 px-2 font-sans text-sm text-destructive">{emailError}</p>
						{/if}
						<Button variant="primary" fullWidth disabled={!email.trim() || submitting} onclick={handleSignUp}>
							SIGN UP FOR UPDATES
						</Button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Community Section -->
		<div class="py-10 bg-card/30">
			<div class="flex flex-col gap-2.5 px-6 md:px-12">
				<h2 class="font-sans text-3xl font-bold text-muted-foreground leading-8">
					This conversation is taking place in communities across the country.
				</h2>
				<p class="font-sans text-lg font-medium text-muted-foreground leading-7">
				  This conversation is taking place in communities across the country. Want to bring this to your community? Get in touch with us at hello@bloom-project.org.
				</p>
			</div>

			<!-- Scrolling community badges -->
			<div class="overflow-hidden my-6">
				<div class="community-marquee flex gap-2 w-max">
					{#each { length: 4 } as _}
						<Badge variant="soft" size="md">
							<MapPin class="size-2.5 mr-1 text-muted-foreground/50" />
							UTAH COUNTIES
						</Badge>
						<Badge variant="soft" size="md">
							<MapPin class="size-2.5 mr-1 text-muted-foreground/50" />
							SAN FRANCISCO
						</Badge>
						<Badge variant="soft" size="md">
							<MapPin class="size-2.5 mr-1 text-muted-foreground/50" />
							CENTRAL OREGON
						</Badge>
					{/each}
				</div>
			</div>

			<div class="px-6 md:px-12">
				<Button href="mailto:hello@bloom-project.org" variant="destructive" fullWidth size="lg">
					START IN YOUR COMMUNITY
				</Button>
			</div>
		</div>

	</div>
</AppShell>

<style>
	.community-marquee {
		animation: community-scroll 20s linear infinite;
	}
	@keyframes community-scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	.pulse-ring {
		animation: phase-pulse 2s ease-out infinite;
	}
	@keyframes phase-pulse {
		0% {
			transform: scale(0);
			opacity: 1;
		}
		80%, 100% {
			transform: scale(2.5);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.community-marquee {
			animation: none;
			transform: none;
		}

		.pulse-ring {
			animation: none;
			transform: scale(1.5);
			opacity: 0.2;
		}
	}
</style>
