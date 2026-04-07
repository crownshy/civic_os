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

<AppShell>
	<div class="flex flex-col bg-gradient-primary h-full overflow-y-auto">
		<!-- Header Bar -->
		<div class="flex items-center justify-between pl-6 pr-3.75 pt-3.75 pb-2">
			<div class="flex items-center gap-1.5">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-foreground/80">
					<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
				</svg>
				<span class="font-mono text-sm font-medium text-foreground/70">{region.stateName.toUpperCase()}</span>
			</div>
			<Button variant="soft" size="xs" href="/">
				SHARE YOUR THOUGHTS →
			</Button>
		</div>

		<!-- Hero Section -->
		<div class="flex flex-col px-6 pt-6 pb-8">
			<span class="font-mono text-base font-medium uppercase text-muted-foreground">
				What should we do about
			</span>
			<h1 class="mt-1 font-sans text-5xl font-extrabold leading-[1.05] text-muted-foreground">
				AI and the future of {region.stateName} communities?
			</h1>
			<p class="mt-5 font-sans text-lg font-medium leading-7 text-muted-foreground">
				A <strong>place-based forum in {region.stateName}</strong> to put real people at the center of shaping our future. All are welcome to join the conversation.
			</p>

			<!-- Phase Navigation -->
			<div class="mt-5 flex items-center gap-1 flex-wrap">
				<Badge variant="dark" size="md">OUR VIEWS</Badge>
				<span class="font-mono text-sm text-muted-foreground/50">&gt;</span>
				<Badge variant="soft" size="md">LISTEN & LEARN</Badge>
				<span class="font-mono text-sm text-muted-foreground/50">&gt;</span>
				<Badge variant="soft" size="md">DECISIONS</Badge>
			</div>
		</div>

		<!-- Our Views Card -->
		<div class="px-6 pb-8">
			<Card class="p-6">
				<div class="flex gap-3">
					<!-- Left indicator -->
					<div class="flex flex-col mr-2 items-center shrink-0 pt-1">
						<div class="relative">
							<div class="absolute -inset-1 rounded-full bg-background/20 shadow-[0px_0px_15px_1px_var(--primary)]"></div>
							<div class="relative w-4 h-4 rounded-full bg-primary"></div>
						</div>
						<div class="mt-1.5 w-0.5 flex-1 bg-linear-to-b from-primary to-transparent"></div>
					</div>

					<!-- Content -->
					<div class="flex-1 min-w-0">
						<span class="font-mono text-xs text-destructive">LIVE NOW</span>
						<h3 class="font-sans text-3xl font-bold leading-tight mt-2 mb-3 text-primary">Our Views</h3>
						<p class="font-sans text-sm font-medium leading-5 mb-6 text-muted-foreground">
							An opportunity for everyday people to share their thoughts on how artificial intelligence should be managed to protect people's livelihoods.
						</p>
						<Button href='/' fullWidth variant="primary" size="md" class="text-sm bg-linear-to-r from-primary to-primary-dark">
							JOIN THE CONVERSATION
						</Button>
					</div>
				</div>
			</Card>
		</div>

		<!-- What is this about? Section -->
		<div class="flex flex-col gap-4 px-6 pb-8">
			<h2 class="font-sans text-4xl font-bold text-muted-foreground leading-9">
				What is this about?
			</h2>
			<p class="font-sans text-sm font-medium text-muted-foreground leading-5">
				This forum is about figuring out what local communities in {region.stateName} can do to make sure the coming changes with artificial intelligence actually serve them. The answer can and will lie at many different levels – in families, schools, community programs, city and state policy, and beyond. No idea is too small, and everyone has a role to play.
			</p>
		</div>

		<!-- Your Hosts Section -->
		<div class="px-6 pb-8">
			<Card class="p-6">
				<span class="font-mono text-xs uppercase text-primary">WHO'S HOLDING THE SPACE?</span>
				<h2 class="font-sans text-3xl font-bold text-muted-foreground leading-8 mt-2 mb-4">
					Your Hosts
				</h2>
					<p class="font-sans text-sm font-medium text-muted-foreground leading-5 mb-6">
					This conversation is supported by public-serving organizations all over {region.stateName}, including <strong class="text-secondary">{region.hostName}</strong> and more.
				</p>
				<a href={region.hostUrl} target="_blank" rel="noopener noreferrer">
				  <Button variant="primary" fullWidth >
					  LEARN MORE
				  </Button>
				</a>
			</Card>
		</div>

		<!-- Timeline Section -->
		<div class="py-10 px-6" style="background: var(--gradient-consensus)">
			<h2 class="font-sans text-4xl font-bold text-primary-foreground text-center leading-9 mb-2">
				Timeline
			</h2>
			<p class="font-sans text-base font-bold text-primary-foreground text-center leading-6 mb-8">
				How it's going down – and how you can take part.
			</p>

			<!-- Phase 1: Our Views -->
			<div class="mb-6">
				<Card class="p-6">
					<div class="flex gap-3">
						<!-- Left indicator -->
						<div class="flex flex-col items-center shrink-0 pt-0.5">
							<div class="relative">
								<div class="absolute -inset-1 rounded-full bg-background/20 shadow-[0px_0px_11px_4px_var(--destructive)]"></div>
								<div class="relative w-4 h-4 rounded-full bg-destructive"></div>
							</div>
							<div class="mt-1.5 w-0.5 flex-1 bg-linear-to-b from-destructive to-transparent"></div>
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<span class="font-mono text-xs font-medium text-destructive/70">PHASE ONE (APRIL 2026)</span>
							<h3 class="font-sans text-3xl font-bold leading-tight mt-2 mb-3 text-muted-foreground">Our Views</h3>
							<p class="font-sans text-sm font-medium leading-5 mb-6 text-muted-foreground">
								An opportunity for everyday people to share their thoughts on how artificial intelligence should be managed to protect people's livelihoods.
							</p>
							<Button href='/' variant="destructive" fullWidth>
								SHARE YOUR PERSPECTIVE →
							</Button>
						</div>
					</div>
				</Card>
			</div>

			<!-- Phase 2: Listen & Learn -->
			<div class="mb-6">
				<Card class="bg-card/10 border-card/20 p-6">
					<div class="flex gap-3">
						<!-- Left indicator -->
						<div class="flex flex-col items-center shrink-0 pt-0.5">
							<div class="w-4 h-4 rounded-full bg-card/20"></div>
							<div class="mt-1.5 w-0.5 flex-1 bg-linear-to-b from-card/20 to-transparent"></div>
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<span class="font-mono text-xs font-medium text-card/70">PHASE TWO (MAY 2026)</span>
							<h3 class="font-sans text-3xl font-bold leading-tight mt-2 mb-3 text-card">Listen & Learn</h3>
							<p class="font-sans text-sm font-medium leading-5 mb-6 text-card">
								Everyone will have a chance to join live conversations to figure out what is actionable from the first phase.
							</p>
							<Button class='text-white bg-white/20 font-bold' variant="gradient" fullWidth disabled>
								TBA
							</Button>
						</div>
					</div>
				</Card>
			</div>

			<!-- Phase 3: Decisions -->
			<Card class="bg-card/10 border-card/20 p-6">
				<div class="flex gap-3">
					<!-- Left indicator -->
					<div class="flex flex-col items-center shrink-0 pt-0.5">
						<div class="w-4 h-4 rounded-full bg-card/20"></div>
						<div class="mt-1.5 w-0.5 flex-1 bg-linear-to-b from-card/20 to-transparent"></div>
					</div>

					<!-- Content -->
					<div class="flex-1 min-w-0">
						<span class="font-mono text-xs font-medium text-card/70">PHASE THREE (MAY 2026)</span>
						<h3 class="font-sans text-3xl font-bold leading-tight mt-2 mb-3 text-card">Decisions</h3>
						<p class="font-sans text-sm font-medium leading-5 mb-6 text-card">
							Everyone will have a chance to join live conversations to figure out what is actionable from the first phase.
						</p>
						<Button class='text-white bg-white/20 font-bold' variant="gradient" fullWidth disabled>
							TBA
						</Button>
					</div>
				</div>
			</Card>
		</div>

		<!-- Email Signup Section -->
		<div class="bg-card/30 py-8 px-6">
			<div class="flex flex-col gap-4 max-w-md mx-auto">
				{#if session.emailProvided}
					<p class="font-sans text-base text-muted-foreground leading-6 text-center" in:fade={{ duration: 400, delay: 300 }}>
						<strong>Received! We'll be in touch.</strong>
					</p>
				{:else}
					<p class="font-sans text-base text-muted-foreground leading-6 text-center">
						<strong>Share your email</strong> to receive updates on this conversation and opportunities to share your voice on this issue.
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
		<div class="py-10 px-6">
			<div class="flex flex-col gap-4 max-w-md mx-auto">
				<h2 class="font-sans text-3xl font-bold text-muted-foreground leading-8">
					This conversation is taking place in communities across the country.
				</h2>
				<p class="font-sans text-lg font-medium text-muted-foreground leading-7">
					Want to bring this conversation to your community? Get in touch with us at <a href="mailto:hello@bloom-project.org" class="font-bold underline">hello@bloom-project.org</a>.
				</p>
				<div class="flex flex-wrap justify-center gap-2 my-4">
					<Badge variant="soft" size="lg">
						<MapPin class="size-3.5 mr-1.5 text-muted-foreground/50" />
						UTAH COUNTIES
					</Badge>
					<Badge variant="soft" size="lg">
						<MapPin class="size-3.5 mr-1.5 text-muted-foreground/50" />
						SAN FRANCISCO
					</Badge>
					<Badge variant="soft" size="lg">
						<MapPin class="size-3.5 mr-1.5 text-muted-foreground/50" />
						CENTRAL OREGON
					</Badge>
				</div>
				<Button href="mailto:hello@bloom-project.org" variant="destructive" fullWidth size="lg">
					START IN YOUR COMMUNITY
				</Button>
			</div>
		</div>

	</div>
</AppShell>
