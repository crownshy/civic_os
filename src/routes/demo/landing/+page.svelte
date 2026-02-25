<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { AppShell } from '$lib/components/layout';
	import { SwipeCarousel } from '$lib/components/ui';
	import { county, deliberation } from '$lib/data/mock';

	const hasHost = $derived($page.url.searchParams.get('host') === 'true');

	let zipCode = $state('');
	let locationName = $state('');
	let editingLocation = $state(true);
	let slideIndex = $state(0);

	const slides = [
		'This is a place-based conversation about how we should regulate social media to minimize its harms on us and those we care about.',
		'Your voice matters. Share your perspective and hear from your neighbors about the issues that affect our community.',
		'This conversation is hosted locally and powered by Bloom. Everything you share is anonymous unless you choose otherwise.'
	];

	// With host: pre-populate location
	$effect(() => {
		if (hasHost) {
			locationName = 'Utah County';
			editingLocation = false;
		}
	});

	function handleSetLocation() {
		if (zipCode.trim()) {
			locationName = 'Utah County';
			editingLocation = false;
		}
	}

	function handleJoin() {
		goto('/demo/contribute');
	}

	let zipInputEl = $state<HTMLInputElement | null>(null);

	function startEditing() {
		editingLocation = true;
		zipCode = '';
		locationName = '';
		setTimeout(() => zipInputEl?.focus(), 50);
	}
</script>

<AppShell>
	<div class="relative flex h-dvh flex-col bg-gradient-primary overflow-hidden">
		<!-- Decorative ellipse -->
		<div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/20 sm:translate-y-1/4 md:translate-y-1/3 lg:translate-y-1/2 w-[120%] aspect-2/1 rounded-t-full bg-gradient-to-b from-blue-600/30 to-transparent"></div>

		<!-- Scrollable content -->
		<div class="relative z-10 flex flex-1 flex-col overflow-y-auto">
			{#if hasHost}
				<!-- Host message banner -->
				<div class="mx-5 mt-2 flex items-center gap-3 rounded-lg bg-gradient-to-r from-white/10 to-white/0 p-4 outline outline-1 outline-white/10 overflow-hidden">
					<span class="h-9 w-9 shrink-0 rounded-full bg-secondary"></span>
					<div>
						<span class="font-mono text-xs font-medium uppercase text-white/70">A MESSAGE FROM YOUR HOST</span>
						<p class="font-sans text-base font-medium text-white">Mormon Women for Ethical Governance</p>
					</div>
				</div>
			{/if}

			<!-- Hero -->
			<div class="flex flex-col items-center px-8 {hasHost ? 'pt-8' : 'pt-24'}">
				<span class="text-center font-mono text-base font-medium uppercase text-white/70">
					A PUBLIC CONVERSATION ON
				</span>
				<h1 class="mt-3 text-center font-sans text-4xl font-bold leading-10 text-white">
					AI and the Future of Our Communities
				</h1>
				{#if hasHost}
					<div class="mt-4 flex items-center gap-2">
						<span class="h-3.5 w-3.5 rounded-full bg-secondary/40"></span>
						<span class="font-sans text-sm font-medium leading-4 text-secondary/80">
							Mormon Women for Ethical Governance
						</span>
					</div>
				{/if}
			</div>

			<!-- Swipeable description carousel -->
			<SwipeCarousel count={slides.length} bind:index={slideIndex} autoScrollMs={4000} class="mt-8 px-10">
				{#snippet children(i)}
					<p class="font-sans text-lg font-medium leading-7 text-white">
						{slides[i]}
					</p>
				{/snippet}
			</SwipeCarousel>
		</div>

		<!-- Bottom section: location + CTA -->
		<div class="relative z-10 flex shrink-0 flex-col items-center px-7 pb-8">
			<span class="font-mono text-base font-medium uppercase text-white/80">YOUR LOCATION</span>

			{#if editingLocation}
				<!-- Zip input mode -->
				<form onsubmit={(e) => { e.preventDefault(); handleSetLocation(); }} class="mt-2 flex flex-col items-center w-full">
					<div class="inline-flex items-center rounded-full bg-white px-6 py-2 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline outline-2 outline-white/20">
						<input
							bind:this={zipInputEl}
							bind:value={zipCode}
							placeholder="Enter your zip code..."
							class="w-60 bg-transparent text-center font-sans text-base font-medium text-blue-900 placeholder:text-blue-900/80 border-0 outline-none focus:ring-0"
						/>
					</div>
					<button
						type="submit"
						class="mt-4 flex h-14 w-full items-center justify-center rounded-full px-7 py-3.5 font-mono text-lg font-medium {zipCode.trim() ? 'bg-secondary text-secondary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]' : 'bg-white/20 text-white/70'}"
					>
						JOIN THE CONVERSATION
					</button>
				</form>
			{:else}
				<!-- Location set — show pill with (change) -->
				<div class="mt-2 inline-flex items-center justify-center gap-1 rounded-full bg-white px-6 py-2 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline outline-2 outline-white/20">
					<span class="py-2 font-sans text-base font-medium text-blue-900">{locationName}</span>
					<button onclick={startEditing} class="font-sans text-base font-medium text-secondary">(change)</button>
				</div>
				<button
					onclick={handleJoin}
					class="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-secondary px-7 py-3.5 font-mono text-lg font-medium text-secondary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					JOIN THE CONVERSATION
				</button>
			{/if}

			<span class="mt-4 font-mono text-sm font-medium text-white/50 opacity-50">POWERED BY BLOOM</span>
		</div>
	</div>
</AppShell>
