<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AboutBar, SwipeCarousel, Button, EmojiCircle } from '$lib/components/ui';

	interface Props {
		countyName: string;
		onContinue: () => void;
		onGoHome: () => void;
	}

	let { countyName, onContinue, onGoHome }: Props = $props();

	let email = $state('');

	const reportSlides = [
		{ title: 'Report Back', body: 'This is a place-based conversation about how we should regulate social media to minimize its harms for ourselves and those we care about.' },
		{ title: 'What We Heard', body: 'Participants broadly agreed on the need for digital literacy education and stronger platform accountability, with nuanced views on parental controls.' },
		{ title: 'What\'s Next', body: 'Results from this conversation will be shared with local officials and community organizations to help inform policy decisions in Utah County.' }
	];
	let reportSlideIndex = $state(0);
</script>

<div class="flex h-full flex-col bg-gradient-primary" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
	<AboutBar {countyName} />

	<!-- Scrollable content -->
	<div class="flex flex-1 flex-col items-center overflow-y-auto px-8 pt-12">
		<!-- Emoji -->
		<EmojiCircle emoji="🎉" size="lg" />

		<!-- Title -->
		<h1 class="mt-4 text-center font-sans text-4xl font-bold leading-10 text-white">
			Thank you!
		</h1>

		<!-- Subtitle -->
		<p class="mt-4 text-center font-sans text-lg font-medium leading-7 text-white/80">
			Sign up to see what everyone else said and get updates on the conversation.
		</p>

		<!-- Email input -->
		<div class="mt-4 flex w-full items-center gap-2.5 rounded-full bg-white px-5 py-3 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline-2 outline-background">
			<svg class="h-4 w-4 shrink-0 text-secondary" fill="currentColor" viewBox="0 0 20 20">
				<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
				<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
			</svg>
			<input
				bind:value={email}
				type="email"
				placeholder="email@xyz.com"
				class="flex-1 bg-transparent font-sans text-xl font-medium text-secondary placeholder:text-secondary/80 border-0 outline-none focus:ring-0"
			/>
		</div>

		<!-- Divider -->
		<div class="mx-auto mt-8 h-0.5 w-24 rounded-full bg-white"></div>

		<!-- Report Back carousel -->
		<div class="mt-4 w-full">
			<h2 class="font-sans text-2xl font-bold leading-9 text-white">Report Back</h2>
			<SwipeCarousel count={reportSlides.length} autoScrollMs={4000} bind:index={reportSlideIndex} class="mt-3">
				{#snippet children(i)}
					<p class="font-sans text-lg font-medium leading-7 text-white/80">
						{reportSlides[i].body}
					</p>
				{/snippet}
			</SwipeCarousel>
		</div>
	</div>

	<!-- Bottom CTAs -->
	<div class="shrink-0 border-t border-background bg-secondary px-7 py-6">
		<div class="flex items-center gap-3.5">
			<Button variant="primary" fullWidth onclick={onContinue}>
				CONTINUE
			</Button>
			<Button variant="secondary" fullWidth onclick={onGoHome} href="/demo">
				GO HOME
			</Button>
		</div>
	</div>
</div>
