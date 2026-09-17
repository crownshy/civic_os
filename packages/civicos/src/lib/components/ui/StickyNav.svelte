<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { NAV_SECTIONS, type NavSection } from '$lib/config/landing-copy';

	interface Props {
		/**
		 * Pills to render, in order. Each `id` must match the anchor on its
		 * section. The landing page passes a list that has the fixed sections
		 * plus one entry per heading in the Host's Context copy.
		 */
		sections?: NavSection[];
		/** Pixel offset from top when the nav is sticky (e.g. height of the chip row above). */
		topOffset?: number;
		/** Optional class applied to the sticky wrapper. */
		class?: string;
	}

	let { sections = NAV_SECTIONS, topOffset = 0, class: className }: Props = $props();

	// What the observer last saw, which is null until the first section crosses
	// the nav. Falling back to the first pill through a derived rather than
	// seeding state keeps this right when `sections` changes under us: a stale
	// id from the previous Campaign is no longer in the list, so it is dropped.
	let observedId = $state<string | null>(null);
	const activeId = $derived(
		sections.some((section) => section.id === observedId) ? observedId : sections[0]?.id
	);

	let scrollContainer: HTMLDivElement | undefined = $state();
	const pillRefs = new SvelteMap<string, HTMLElement>();

	/** Attach factory: registers/unregisters a pill button against its section id. */
	function pillRef(id: string) {
		return (node: HTMLElement) => {
			pillRefs.set(id, node);
			return () => pillRefs.delete(id);
		};
	}

	function handleClick(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	// Observe each section. A section is "active" when its top crosses just below the
	// sticky nav; remains active until the next section's top does the same.
	//
	// An $effect rather than onMount because the Context pills come from data:
	// a client-side navigation to another Campaign swaps the sections out, and
	// the observers have to be rebuilt against the new anchors.
	$effect(() => {
		const observers: IntersectionObserver[] = [];
		const navHeight = 48;

		for (const section of sections) {
			const el = document.getElementById(section.id);
			if (!el) continue;
			const obs = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							observedId = section.id;
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
		const pill = activeId ? pillRefs.get(activeId) : undefined;
		if (pill && scrollContainer) {
			const pillRect = pill.getBoundingClientRect();
			const containerRect = scrollContainer.getBoundingClientRect();
			const target = pillRect.left - containerRect.left + scrollContainer.scrollLeft - 15;
			scrollContainer.scrollTo({ left: target, behavior: 'smooth' });
		}
	});
</script>

<div
	class={['sticky z-30 w-full overflow-x-auto bg-background/95 backdrop-blur-sm', className]
		.filter(Boolean)
		.join(' ')}
	style:top="{topOffset}px"
	bind:this={scrollContainer}
>
	<div class="flex items-center gap-2.5 px-6 py-2.5 md:justify-center">
		{#each sections as section (section.id)}
			{@const isActive = activeId === section.id}
			<button
				type="button"
				onclick={() => handleClick(section.id)}
				{@attach pillRef(section.id)}
				class={[
					'shrink-0 rounded-[20px] px-2.5 py-[3px] font-mono text-sm font-medium whitespace-nowrap transition-colors',
					isActive
						? 'bg-primary text-primary-foreground'
						: 'bg-primary/10 text-primary hover:bg-primary/20'
				].join(' ')}
			>
				{section.label}
			</button>
		{/each}
	</div>
</div>
