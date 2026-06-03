<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { NAV_SECTIONS, type NavSectionId } from '$lib/config/landing-copy';

	interface Props {
		/** Pixel offset from top when the nav is sticky (e.g. height of the chip row above). */
		topOffset?: number;
		/** Optional class applied to the sticky wrapper. */
		class?: string;
	}

	let { topOffset = 0, class: className }: Props = $props();

	let activeId = $state<NavSectionId>(NAV_SECTIONS[0].id);
	let scrollContainer: HTMLDivElement | undefined = $state();
	const pillRefs = new SvelteMap<NavSectionId, HTMLElement>();

	/** Attach factory: registers/unregisters a pill button against its section id. */
	function pillRef(id: NavSectionId) {
		return (node: HTMLElement) => {
			pillRefs.set(id, node);
			return () => pillRefs.delete(id);
		};
	}

	function handleClick(id: NavSectionId) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	onMount(() => {
		// Observe each section. A section is "active" when its top crosses just below the
		// sticky nav; remains active until the next section's top does the same.
		const observers: IntersectionObserver[] = [];
		const navHeight = 48;

		for (const section of NAV_SECTIONS) {
			const el = document.getElementById(section.id);
			if (!el) continue;
			const obs = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							activeId = section.id;
						}
					}
				},
				{
					rootMargin: `-${topOffset + navHeight}px 0px -60% 0px`,
					threshold: 0
				}
			);
			obs.observe(el);
			observers.push(obs);
		}

		return () => {
			for (const obs of observers) obs.disconnect();
		};
	});

	// When the active pill changes, scroll it into view in the horizontal pill container.
	// scrollIntoView is a DOM side-effect, not a state assignment — $effect is correct here.
	// Browser clamps scroll range automatically — handles the "out of scrollable space" case.
	$effect(() => {
		const pill = pillRefs.get(activeId);
		if (pill && scrollContainer) {
			pill.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
		}
	});
</script>

<div
	class={[
		'sticky z-30 w-full overflow-x-auto bg-gradient-to-b from-orange-50 to-orange-50/95 backdrop-blur-sm',
		className
	]
		.filter(Boolean)
		.join(' ')}
	style:top="{topOffset}px"
	bind:this={scrollContainer}
>
	<div class="flex items-center gap-2.5 px-6 py-2.5">
		{#each NAV_SECTIONS as section (section.id)}
			{@const isActive = activeId === section.id}
			<button
				type="button"
				onclick={() => handleClick(section.id)}
				{@attach pillRef(section.id)}
				class={[
					'shrink-0 rounded-[20px] px-2.5 py-[3px] font-mono text-sm font-medium whitespace-nowrap transition-colors',
					isActive
						? 'bg-yellow-950 text-white'
						: 'bg-yellow-600/10 text-stone-500 hover:bg-yellow-600/20'
				].join(' ')}
			>
				{section.label}
			</button>
		{/each}
	</div>
</div>
