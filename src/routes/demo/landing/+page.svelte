<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppShell } from '$lib/components/layout';
	import { county, deliberation } from '$lib/data/mock';

	type Step = 'landing' | 'with-location' | 'email-capture';

	let step = $state<Step>('landing');
	let zipCode = $state('');
	let email = $state('');
	let locationSet = $state(false);

	// Carousel slides
	const slides = [
		'This is a place-based conversation about how we should regulate social media to minimize its harms on us and those we care about.',
		'Your voice matters. Share your perspective and hear from your neighbors about the issues that affect our community.',
		'This conversation is hosted locally and powered by Bloom. Everything you share is anonymous unless you choose otherwise.'
	];

	let slideIndex = $state(0);
	let touchStartX = $state(0);
	let touchDeltaX = $state(0);
	let swiping = $state(false);

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchDeltaX = 0;
		swiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!swiping) return;
		touchDeltaX = e.touches[0].clientX - touchStartX;
	}

	function handleTouchEnd() {
		if (!swiping) return;
		swiping = false;
		if (touchDeltaX < -40 && slideIndex < slides.length - 1) {
			slideIndex++;
		} else if (touchDeltaX > 40 && slideIndex > 0) {
			slideIndex--;
		}
		touchDeltaX = 0;
	}

	function handleSetLocation() {
		if (zipCode.trim()) {
			locationSet = true;
			step = 'with-location';
		}
	}
</script>

<AppShell>
	{#if step === 'landing'}
		<!-- LANDING: zip code entry -->
		<div class="relative flex h-dvh flex-col bg-gradient-to-b from-blue-700 to-blue-900 overflow-hidden" in:fade={{ duration: 400 }}>
			<!-- Decorative ellipse — half-circle anchored to bottom -->
			<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140%] aspect-[2/1] rounded-t-full bg-gradient-to-b from-blue-600/30 to-transparent"></div>

			<!-- Scrollable content -->
			<div class="relative z-10 flex flex-1 flex-col overflow-y-auto">
				<!-- Back button -->
				<a
					href="/demo"
					class="flex h-10 w-10 items-center justify-center text-white"
					aria-label="Back"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
				</a>

				<!-- Hero -->
				<div class="flex flex-col items-center px-8 pt-24">
					<span class="text-center font-mono text-base font-medium uppercase text-white/70">
						A PUBLIC CONVERSATION ON
					</span>
					<h1 class="mt-3 text-center font-sans text-4xl font-bold leading-10 text-white">
						AI and the Future of Our Communities
					</h1>
					<!-- Host badge -->
					<div class="mt-4 flex items-center gap-2">
						<span class="h-3.5 w-3.5 rounded-full bg-cyan-200"></span>
						<span class="font-sans text-sm font-medium leading-4 text-cyan-200">
							Mormon Women for Ethical Governance
						</span>
					</div>
				</div>

				<!-- Swipeable description carousel -->
				<div
					class="mt-8 overflow-hidden px-10"
					ontouchstart={handleTouchStart}
					ontouchmove={handleTouchMove}
					ontouchend={handleTouchEnd}
					role="region"
					aria-label="Info carousel"
				>
					{#key slideIndex}
						<p
							class="font-sans text-lg font-medium leading-7 text-white"
							in:fly={{ x: touchDeltaX <= 0 ? 60 : -60, duration: 250, easing: cubicOut }}
						>
							{slides[slideIndex]}
						</p>
					{/key}
					<!-- Dots -->
					<div class="mt-8 flex items-center justify-center gap-[23px]">
						{#each slides as _, i}
							<button
								onclick={() => (slideIndex = i)}
								class="h-2 w-2 rounded-full transition-colors {i === slideIndex ? 'bg-white' : 'bg-zinc-300/50'}"
								aria-label="Slide {i + 1}"
							></button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Bottom section: location + CTA -->
			<div class="relative z-10 flex shrink-0 flex-col items-center px-7 pb-8">
				<span class="font-mono text-base font-medium uppercase text-white/80">YOUR LOCATION</span>
				<div class="mt-2 inline-flex items-center rounded-full bg-white px-6 py-2 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline outline-2 outline-white/20">
					<input
						bind:value={zipCode}
						placeholder="Enter your zip code..."
						class="w-50 bg-transparent text-center font-sans text-base font-medium text-blue-900 placeholder:text-blue-900/80 border-0 outline-none focus:ring-0"
					/>
				</div>
				<button
					onclick={handleSetLocation}
					class="mt-4 flex h-14 w-full items-center justify-center rounded-full px-7 py-3.5 font-mono text-lg font-medium {zipCode.trim() ? 'bg-teal-500 text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]' : 'bg-white/20 text-white/70'}"
				>
					JOIN THE CONVERSATION
				</button>
				<span class="mt-4 font-mono text-sm font-medium text-white/50 opacity-50">POWERED BY BLOOM</span>
			</div>
		</div>

	{:else if step === 'with-location'}
		<!-- WITH LOCATION: show host banner, location filled -->
		<div class="relative flex h-dvh flex-col bg-gradient-to-b from-blue-700 to-blue-900 overflow-hidden" in:fade={{ duration: 400 }}>
			<!-- Decorative ellipse — half-circle anchored to bottom -->
			<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140%] aspect-[2/1] rounded-t-full bg-gradient-to-b from-blue-600/30 to-transparent"></div>

			<!-- Scrollable content -->
			<div class="relative z-10 flex flex-1 flex-col overflow-y-auto">
				<!-- Back button -->
				<button
					onclick={() => (step = 'landing')}
					class="flex h-10 w-10 items-center justify-center text-white"
					aria-label="Back"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
				</button>

				<!-- Host message banner -->
				<div class="mx-5 mt-2 flex items-center gap-3 rounded-lg bg-gradient-to-r from-white/10 to-white/0 p-4 outline outline-1 outline-white/10 overflow-hidden">
					<span class="h-9 w-9 shrink-0 rounded-full bg-teal-400"></span>
					<div>
						<span class="font-mono text-xs font-medium uppercase text-white/70">A MESSAGE FROM YOUR HOST</span>
						<p class="font-sans text-base font-medium text-white">Mormon Women for Ethical Governance</p>
					</div>
				</div>

				<!-- Hero -->
				<div class="flex flex-col items-center px-8 pt-8">
					<span class="text-center font-mono text-base font-medium uppercase text-white/70">
						A PUBLIC CONVERSATION ON
					</span>
					<h1 class="mt-3 text-center font-sans text-4xl font-bold leading-10 text-white">
						AI and the Future of Our Communities
					</h1>
					<!-- White divider -->
					<div class="mt-4 h-1 w-20 bg-white"></div>
				</div>

				<!-- Swipeable description carousel -->
				<div
					class="mt-8 overflow-hidden px-10"
					ontouchstart={handleTouchStart}
					ontouchmove={handleTouchMove}
					ontouchend={handleTouchEnd}
					role="region"
					aria-label="Info carousel"
				>
					{#key slideIndex}
						<p
							class="font-sans text-lg font-medium leading-7 text-white"
							in:fly={{ x: touchDeltaX <= 0 ? 60 : -60, duration: 250, easing: cubicOut }}
						>
							{slides[slideIndex]}
						</p>
					{/key}
					<!-- Dots -->
					<div class="mt-8 flex items-center justify-center gap-[23px]">
						{#each slides as _, i}
							<button
								onclick={() => (slideIndex = i)}
								class="h-2 w-2 rounded-full transition-colors {i === slideIndex ? 'bg-white' : 'bg-zinc-300/50'}"
								aria-label="Slide {i + 1}"
							></button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Bottom section: location filled + CTA -->
			<div class="relative z-10 flex shrink-0 flex-col items-center px-7 pb-8">
				<span class="font-mono text-base font-medium uppercase text-white/80">YOUR LOCATION</span>
				<div class="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-6 py-2 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline outline-2 outline-white/20">
					<span class="font-sans text-base font-medium text-blue-900">Utah County</span>
					<button onclick={() => (step = 'landing')} class="font-sans text-base font-medium text-teal-500">(change)</button>
				</div>
				<button
					onclick={() => (step = 'email-capture')}
					class="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-teal-500 px-7 py-3.5 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					JOIN THE CONVERSATION
				</button>
				<span class="mt-4 font-mono text-sm font-medium text-white/50 opacity-50">POWERED BY BLOOM</span>
			</div>
		</div>

	{:else if step === 'email-capture'}
		<!-- EMAIL CAPTURE overlay -->
		<div class="relative flex h-dvh flex-col bg-gradient-to-b from-blue-700 to-blue-900 overflow-hidden" in:fade={{ duration: 400 }}>
			<!-- Decorative ellipse — half-circle anchored to bottom -->
			<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140%] aspect-[2/1] rounded-t-full bg-gradient-to-b from-blue-600/30 to-transparent"></div>

			<!-- Background content (dimmed) -->
			<div class="absolute inset-0 z-0 opacity-5">
				<div class="flex flex-col items-center px-8 pt-40">
					<h1 class="text-center font-sans text-4xl font-bold leading-10 text-white">AI and the Future of Our Communities</h1>
				</div>
			</div>

			<!-- Dark overlay + email card -->
			<div class="relative z-10 flex flex-1 flex-col bg-blue-950/95">
				<!-- Back button -->
				<button
					onclick={() => (step = 'with-location')}
					class="flex h-10 w-10 items-center justify-center text-white"
					aria-label="Back"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
				</button>

				<div class="flex flex-1 flex-col items-center justify-center px-4">
					<!-- White email card -->
					<div class="w-full rounded-[20px] bg-white p-6 outline outline-2 outline-white overflow-hidden">
						<h2 class="font-sans text-4xl font-bold leading-10 text-blue-800">Share your email</h2>
						<p class="mt-4 font-sans text-lg font-medium leading-7 text-blue-800">
							We'll only use this to give you updates on this conversation. No spam, no marketing emails or anything like that.
						</p>
						<div class="mt-4 flex h-11 items-center rounded-full bg-white shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline outline-2 outline-blue-700 overflow-hidden px-5">
							<input
								bind:value={email}
								placeholder="email@xyz.com"
								class="w-full bg-transparent font-sans text-base font-medium text-blue-900 placeholder:text-blue-900/80 border-0 outline-none focus:ring-0"
							/>
						</div>
					</div>

					<!-- SHARE button -->
					<div class="mt-6 w-full px-2">
						<a
							href="/demo/contribute"
							class="flex w-full items-center justify-center rounded-full bg-teal-500 px-7 py-3.5 font-mono text-lg font-medium text-white"
						>
							SHARE
						</a>
					</div>

					<!-- Skip link -->
					<a
						href="/demo/contribute"
						class="mt-6 font-mono text-sm font-medium uppercase leading-5 text-white"
					>
						I'll decide later.
					</a>
				</div>
			</div>
		</div>
	{/if}
</AppShell>
