<script lang="ts">
	interface Props {
		/** Fill amount, 0-100. Clamped to the track. */
		fill: number;
		/** Tailwind background class for the fill. */
		fillClass?: string;
		/** Optional 0-100 position for a goal marker line. `null` hides it. */
		marker?: number | null;
		/** Extra classes for the track (e.g. `w-full` or `flex-1`). */
		class?: string;
	}

	let { fill, fillClass = 'bg-meter-met', marker = null, class: className = '' }: Props = $props();

	const clampedFill = $derived(Math.min(100, Math.max(0, fill)));
</script>

<div class={`bg-meter-track relative h-2.5 overflow-hidden ${className}`}>
	<div
		class={`h-full transition-all duration-300 ${fillClass}`}
		style:width={`${clampedFill}%`}
	></div>
	{#if marker !== null}
		<div class="absolute top-0 bottom-0 w-px bg-stone-300" style:left={`${marker}%`}></div>
	{/if}
</div>
