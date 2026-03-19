<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Carousel from '$lib/components/ui/carousel';
	import { type CarouselAPI } from './carousel/context';
	import Autoplay from 'embla-carousel-autoplay';
	import Play from '$lib/assets/icons/play.svelte';
	import Pause from '$lib/assets/icons/pause.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		/** Total number of slides */
		count: number;
		/** Current active index (bindable) */
		index?: number;
		/** Render function receiving the current index */
		children: Snippet<[number]>;
		/** Optional extra class on the outer wrapper */
		class?: string;
		/** Auto-advance interval in ms (e.g. 4000). Disabled if not set. */
		autoScrollMs?: number;
	}

	let {
		count,
		index = $bindable(0),
		children,
		class: className = '',
		autoScrollMs
	}: Props = $props();

	let api = $state<CarouselAPI>();

	function handleDotClick(i: number) {
		api.scrollTo(i);
	}

	let selectedSlide = $state(0);

	$effect(() => {
		if (api) {
			selectedSlide = api.selectedScrollSnap() + 1;
			api.on("select", () => {
				selectedSlide = api!.selectedScrollSnap() + 1;
			});
		}
	});

	let autoplay = $state(true);

	function toggleAutoplay() {
		if (!api) return;

		if (autoplay) {
			api.plugins().autoplay?.stop();
			autoplay = false;
		} else {
			api.plugins().autoplay?.play();
			autoplay = true;
		}
	}
</script>

<Carousel.Root
	class={cn("w-full", className)}
	opts={{ loop: true }}
	setApi={(emblaApi) => (api = emblaApi)}
	plugins={[Autoplay({ delay: autoScrollMs })]}
>
	<Carousel.Content>
		{#each { length: count } as _, i (i)}
			<Carousel.Item>
				<div>{@render children(i)}</div>
			</Carousel.Item>
		{/each}
	</Carousel.Content>
	<!-- Dots -->
	<div class="mt-6 flex shrink-0 items-center justify-center gap-[23px]">
		{#each { length: count } as _, i (i)}
			<button
				onclick={() => handleDotClick(i)}
				class="h-2 w-2 rounded-full transition-colors {selectedSlide === i + 1 ? 'bg-muted-foreground' : 'bg-muted-foreground/50'}"
				aria-label="Slide {i + 1}"
			></button>
		{/each}
		<button class="bg-muted-foreground rounded-full p-1.5 flex items-center justify-center" onclick={toggleAutoplay}>
			{#if autoplay}
				<Pause class="stroke-background h-1.5 w-1.5" />
			{:else}
				<Play class="fill-background h-1.5 w-1.5" />
			{/if}
		</button>
	</div>
</Carousel.Root>
