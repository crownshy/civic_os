<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface Props {
		/** Gradient classes for the border (e.g. 'bg-linear-to-b from-stone-300 to-transparent'). Enables gradient border technique. */
		borderGradient?: string;
		/** Solid border/outline classes when not using gradient border (e.g. 'outline outline-1 outline-stone-500/20') */
		borderClass?: string;
		/** Background classes for the content area (e.g. 'bg-white' or 'bg-linear-to-b from-white/90 to-white/0') */
		bg?: string;
		/** Border radius in px, applied uniformly (default 30). Ignored when roundedClass is set. */
		radius?: number;
		/** Tailwind rounding class override (e.g. 'rounded-t-[30px]'). Overrides radius prop. */
		roundedClass?: string;
		/** Shadow classes (e.g. 'shadow-[0px_4px_24.3px_0px_rgba(134,101,73,0.20)]') */
		shadow?: string;
		/** Extra classes on the outermost wrapper */
		class?: string;
		children: Snippet;
	}

	let {
		borderGradient,
		borderClass = '',
		bg = 'bg-white',
		radius = 30,
		roundedClass,
		shadow = '',
		class: className = '',
		children
	}: Props = $props();
</script>

{#if borderGradient}
	<!-- Gradient border: outer div is the gradient "border", inner div is the content bg -->
	<div
		class={cn('p-px overflow-hidden', roundedClass, borderGradient, shadow, className)}
		style={roundedClass ? undefined : `border-radius: ${radius}px;`}
	>
		<div
			class={cn('h-full w-full overflow-hidden', roundedClass, bg)}
			style={roundedClass ? undefined : `border-radius: ${radius - 1}px;`}
		>
			{@render children()}
		</div>
	</div>
{:else}
	<!-- Solid border: single div with border/outline + background -->
	<div
		class={cn('overflow-hidden', roundedClass, bg, borderClass, shadow, className)}
		style={roundedClass ? undefined : `border-radius: ${radius}px;`}
	>
		{@render children()}
	</div>
{/if}
