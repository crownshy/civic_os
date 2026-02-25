<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Header, SwipeCarousel, Button, EmojiCircle } from '$lib/components/ui';
	import { scale } from 'svelte/transition';

	interface Props {
		countyName: string;
		onContinue: () => void;
		onGoHome: () => void;
	}

	let { countyName, onContinue, onGoHome }: Props = $props();

	const reportSlides = [
		{ title: 'Report Back', body: 'This is a place-based conversation about how we should regulate social media to minimize its harms for ourselves and those we care about.' },
		{ title: 'What We Heard', body: 'Participants broadly agreed on the need for digital literacy education and stronger platform accountability, with nuanced views on parental controls.' },
		{ title: 'What\'s Next', body: 'Results from this conversation will be shared with local officials and community organizations to help inform policy decisions in Utah County.' }
	];
	let reportSlideIndex = $state(0);
</script>

<div class="flex h-dvh flex-col bg-gradient-primary" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
	<Header {countyName} />

	<!-- Centered content -->
	<div class="flex flex-1 flex-col items-center mt-16 overflow-y-auto px-8">
		<EmojiCircle emoji="🎉" size="lg" />
		<p class="mt-4 font-sans text-3xl font-bold leading-10 text-white">
			Thank you for participating! Here's what's next...
		</p>

	<!-- Report Back swipeable carousel -->
	<SwipeCarousel count={reportSlides.length} autoScrollMs={4000} bind:index={reportSlideIndex} class="mt-5 border-t border-white/20 pt-5">
			{#snippet children(i)}
				<h3 class="font-sans text-xl font-bold leading-7 text-white">{reportSlides[i].title}</h3>
				<p class="mt-2 font-sans text-base font-medium leading-6 text-white/80">
					{reportSlides[i].body}
				</p>
			{/snippet}
		</SwipeCarousel>
	</div>

	<!-- Bottom CTAs -->
	<div class="flex shrink-0 items-center gap-3.5 px-7 py-6">
		<Button variant="primary" fullWidth onclick={onContinue}>
			CONTINUE
		</Button>
		<Button variant="secondary" fullWidth onclick={onGoHome} href="/demo">
			GO HOME
		</Button>
	</div>
</div>
