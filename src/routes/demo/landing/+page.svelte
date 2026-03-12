<script lang="ts">
	import { fade, scale, fly } from 'svelte/transition';
	import { elasticOut, cubicOut } from 'svelte/easing';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { AppShell } from '$lib/components/layout';
	import { SwipeCarousel, Button, EmailCapture, EmojiCircle, InfoOverlay, ZipInput } from '$lib/components/ui';
	import { county, deliberation } from '$lib/data/mock';

	// --- Valid Utah zip codes (mock validation) ---
	const VALID_UTAH_ZIPS = new Set([
		'84001','84003','84004','84005','84006','84009','84010','84014','84015',
		'84020','84025','84037','84040','84041','84042','84043','84044','84045',
		'84047','84049','84057','84058','84059','84060','84062','84065','84070',
		'84074','84075','84078','84081','84084','84088','84092','84093','84094',
		'84095','84096','84097','84098','84101','84102','84103','84104','84105',
		'84106','84107','84108','84109','84111','84112','84113','84115','84116',
		'84117','84118','84119','84120','84121','84123','84124','84128','84129',
		'84132','84138','84143','84150','84157','84165','84170','84171','84180',
		'84189','84190','84199','84301','84302','84304','84306','84310','84311',
		'84314','84315','84317','84318','84319','84320','84321','84322','84324',
		'84325','84326','84327','84328','84330','84332','84333','84335','84336',
		'84337','84338','84339','84340','84341','84401','84403','84404','84405',
		'84414','84601','84602','84604','84606','84620','84626','84633','84640',
		'84645','84648','84651','84653','84655','84660','84663','84664','84701',
		'84720','84721','84737','84738','84741','84745','84770','84780','84790',
	]);

	function isValidUtahZip(zip: string): boolean {
		return VALID_UTAH_ZIPS.has(zip.trim());
	}

	function countyForZip(_zip: string): string {
		// Mock: always return Utah County for valid zips
		return 'Utah County';
	}

	// --- Flow steps ---
	type Step = 'landing' | 'email-capture' | 'host-message';

	let step = $state<Step>('landing');
	let zipCode = $state('');
	let hasZip = $state(false);
	let slideIndex = $state(0);
	let emailProvided = $state(false);

	const zipOptions = [...VALID_UTAH_ZIPS];

	const slides = [
		'This is a place-based conversation about how we should regulate social media to minimize its harms for ourselves and those we care about.',
		'Your voice matters. Share your perspective and hear from your neighbors about the issues that affect our community.',
		'This conversation is hosted locally and powered by Bloom. Everything you share is anonymous unless you choose otherwise.'
	];

	function handleZipSelect(_zip: string) {
		hasZip = true;
	}

	function handleJoin() {
		step = 'email-capture';
	}

	function handleEmailSubmit(email: string) {
		emailProvided = true;
		step = 'host-message';
	}

	function handleEmailSkip() {
		step = 'host-message';
	}

	function handleHostDismiss() {
		// Navigate to contribute with zip and email state via URL params
		const params = new URLSearchParams();
		params.set('zip', zipCode.trim());
		if (emailProvided) params.set('email', 'true');
		goto(`/demo/contribute?${params.toString()}`);
	}

</script>

<AppShell>
	<div class="relative flex h-full flex-col bg-gradient-primary overflow-hidden">
		<!-- Decorative ellipse -->
		<div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2/5 w-[160%] aspect-2/1 rounded-t-full bg-linear-to-b from-background/30 to-transparent"></div>

		<!-- Scrollable content -->
		<div class="relative z-10 flex flex-1 flex-col overflow-y-auto">
			<!-- Host badge -->
			<div class="mx-5 mt-2 flex items-center gap-3 rounded-lg bg-linear-to-r from-white/10 to-white/0 p-3.5 shadow-[0px_4px_12px_0px_rgba(12,34,95,0.25)] outline-1 outline-white/10 overflow-hidden">
				<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary">
					<span class="text-2xl origin-center rotate-155 [text-shadow:0px_4px_4px_rgb(0_0_0/0.25)]">📣</span>
				</div>
				<div>
					<span class="font-mono text-xs font-medium uppercase text-white/70">HOSTED BY</span>
					<p class="font-sans text-base font-medium text-white">Utah Common Ground</p>
				</div>
			</div>

			<!-- Hero -->
			<div class="flex flex-col items-center px-8 pt-12">
				<span class="text-center font-mono text-base font-medium uppercase text-white/70">
					A PUBLIC CONVERSATION ON
				</span>
				<h1 class="mt-3 text-center font-sans text-4xl font-bold leading-9 text-white">
					AI and the Future of Our Communities
				</h1>
				<div class="mt-4 flex items-center gap-2">
					<span class="h-3.5 w-3.5 rounded-full bg-primary/40"></span>
					<span class="font-sans text-sm font-medium leading-4 text-primary-foreground/70">
						Mormon Women for Ethical Governance
					</span>
				</div>
			</div>

			<!-- Divider -->
			<div class="mx-auto mt-6 h-1 w-20 rounded-full bg-white"></div>

			<!-- Swipeable description carousel -->
			<SwipeCarousel count={slides.length} bind:index={slideIndex} autoScrollMs={4000} class="mt-6 px-10">
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

			<div class="mt-3">
				<ZipInput bind:value={zipCode} options={zipOptions} onSelect={handleZipSelect} />
			</div>

			<Button variant="primary" fullWidth disabled={!hasZip} onclick={handleJoin} class="mt-4">
				JOIN THE CONVERSATION
			</Button>

			<span class="mt-3 font-mono text-sm font-medium text-white/50">POWERED BY BLOOM</span>
		</div>
	</div>

	<!-- Email capture overlay -->
	{#if step === 'email-capture'}
		<div
			class="absolute inset-0 z-50 flex flex-col overflow-hidden bg-secondary/95"
			transition:fade={{ duration: 200 }}
		>
			<!-- Background: show the landing page content faintly through -->
			<div class="flex flex-1 flex-col items-center justify-center px-4">
				<EmailCapture
					onSubmit={handleEmailSubmit}
					onSkip={handleEmailSkip}
				/>
			</div>
		</div>
	{/if}

	<!-- Host message overlay -->
	{#if step === 'host-message'}
		<InfoOverlay title="A Message from Your Hosts" buttonText="Continue" onClose={handleHostDismiss}>
			<div class="pt-6">
				<p class="font-sans text-lg font-medium leading-7 text-secondary">
					Thank you for joining this conversation about how Utah can prepare for the growing impact of AI. Your voice matters and will help shape how our community navigates this important issue.
				</p>
				<p class="mt-4 font-sans text-lg font-medium leading-7 text-secondary">
					This conversation is hosted by the <strong>Utah Common Ground Steering Committee</strong>, with the support of many nonpartisan organizations across Utah.
				</p>
			</div>
		</InfoOverlay>
	{/if}
</AppShell>
