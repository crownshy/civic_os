<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';

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

	let touchStartX = $state(0);
	let touchDeltaX = $state(0);
	let swiping = $state(false);

	// Auto-scroll timer
	let autoTimer: ReturnType<typeof setInterval> | null = null;

	function startAutoScroll() {
		stopAutoScroll();
		if (!autoScrollMs || autoScrollMs <= 0) return;
		autoTimer = setInterval(() => {
			index = (index + 1) % count;
		}, autoScrollMs);
	}

	function stopAutoScroll() {
		if (autoTimer) {
			clearInterval(autoTimer);
			autoTimer = null;
		}
	}

	function resetAutoScroll() {
		if (autoScrollMs && autoScrollMs > 0) startAutoScroll();
	}

	// Start auto-scroll on mount if configured
	$effect(() => {
		if (autoScrollMs && autoScrollMs > 0) {
			startAutoScroll();
		}
		return () => stopAutoScroll();
	});

	function handleTouchStart(e: TouchEvent) {
		stopAutoScroll();
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
		if (touchDeltaX < -40 && index < count - 1) {
			index++;
		} else if (touchDeltaX > 40 && index > 0) {
			index--;
		}
		touchDeltaX = 0;
		resetAutoScroll();
	}

	function handleDotClick(i: number) {
		index = i;
		resetAutoScroll();
	}

	onDestroy(() => stopAutoScroll());
</script>

<div
	class="flex flex-col overflow-hidden {className}"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	role="region"
	aria-label="Carousel"
>
	<div class="flex-1">
		{#key index}
			<div in:fly={{ x: touchDeltaX <= 0 ? 80 : -80, duration: 750, easing: cubicInOut }}>
				{@render children(index)}
			</div>
		{/key}
	</div>
	<!-- Dots -->
	<div class="mt-6 flex shrink-0 items-center justify-center gap-[23px]">
		{#each { length: count } as _, i}
			<button
				onclick={() => handleDotClick(i)}
				class="h-2 w-2 rounded-full transition-colors {i === index ? 'bg-muted-foreground' : 'bg-muted-foreground/50'}"
				aria-label="Slide {i + 1}"
			></button>
		{/each}
	</div>
</div>
