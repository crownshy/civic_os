<script lang="ts">
	import { onMount } from 'svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	let lane = $state<HTMLDivElement>();

	/**
	 * Auto-advances every 5–10s (randomised so several carousels on one page do
	 * not shift in lockstep) and stops for good the moment someone touches,
	 * wheels or drags it. Deliberately not resumable: once a reader has taken
	 * hold of a carousel, moving it under them again is worse than doing nothing.
	 */
	onMount(() => {
		const el = lane;
		if (!el) return;
		const cards = [...el.children] as HTMLElement[];
		if (matchMedia('(prefers-reduced-motion: reduce)').matches || cards.length < 2) return;

		let index = 0;
		const timer = setInterval(
			() => {
				index = (index + 1) % cards.length;
				const card = cards[index];
				// scroll only this lane's own horizontal axis; scrollIntoView, even
				// with block:'nearest', can nudge the page's vertical scroll, which
				// reads as the whole viewport jumping on its own
				el.scrollTo({
					left: card.offsetLeft - (el.clientWidth - card.clientWidth) / 2,
					behavior: 'smooth'
				});
			},
			5000 + Math.random() * 5000
		);

		const events = ['pointerdown', 'wheel', 'touchstart'] as const;
		const stop = () => {
			clearInterval(timer);
			events.forEach((e) => el.removeEventListener(e, stop));
		};
		events.forEach((e) => el.addEventListener(e, stop, { passive: true }));

		return stop;
	});
</script>

<div class="carousel" bind:this={lane}>
	{@render children()}
</div>

<style>
	.carousel {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		overflow-x: auto;
		padding: 2px 7% 14px;
		margin: 0 -22px;
		scroll-snap-type: x mandatory;
		scroll-padding-inline: 7%;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}
	.carousel::-webkit-scrollbar {
		display: none;
	}
	/* each card takes most of the row and centers when snapped, with a
	   sliver of its neighbor peeking on either side */
	.carousel :global(.icard) {
		flex: 0 0 86%;
		scroll-snap-align: center;
	}
	@media (min-width: 660px) {
		.carousel {
			padding-inline: 3%;
			scroll-padding-inline: 3%;
		}
		.carousel :global(.icard) {
			flex-basis: 94%;
		}
	}
</style>
