<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface Props {
		borderGradient?: string;
		borderClass?: string;
		bg?: string;
		radius?: number;
		roundedClass?: string;
		shadow?: string;
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
