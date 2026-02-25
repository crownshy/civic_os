<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
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
	}

	let {
		count,
		index = $bindable(0),
		children,
		class: className = ''
	}: Props = $props();

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
		if (touchDeltaX < -40 && index < count - 1) {
			index++;
		} else if (touchDeltaX > 40 && index > 0) {
			index--;
		}
		touchDeltaX = 0;
	}
</script>

<div
	class="overflow-hidden {className}"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	role="region"
	aria-label="Carousel"
>
	{#key index}
		<div in:fly={{ x: touchDeltaX <= 0 ? 60 : -60, duration: 250, easing: cubicOut }}>
			{@render children(index)}
		</div>
	{/key}
	<!-- Dots -->
	<div class="mt-6 flex items-center justify-center gap-[23px]">
		{#each { length: count } as _, i}
			<button
				onclick={() => (index = i)}
				class="h-2 w-2 rounded-full transition-colors {i === index ? 'bg-white' : 'bg-zinc-300/50'}"
				aria-label="Slide {i + 1}"
			></button>
		{/each}
	</div>
</div>
