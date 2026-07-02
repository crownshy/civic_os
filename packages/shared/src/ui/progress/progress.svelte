<script lang="ts">
	import { cn } from '../../utils.js';
	import type { WithElementRef } from '../../utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		value = 0,
		max = 100,
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		value?: number;
		max?: number;
	} = $props();

	const pct = $derived(Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0)));
</script>

<div
	bind:this={ref}
	role="progressbar"
	aria-valuemin={0}
	aria-valuemax={max}
	aria-valuenow={value}
	class={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/10', className)}
	{...restProps}
>
	<div
		class="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
		style={`width: ${pct}%`}
	></div>
</div>
