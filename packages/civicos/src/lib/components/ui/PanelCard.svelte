<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	/**
	 * A rounded, bordered panel. Was `GradientCard`: it drew a gradient border by
	 * nesting a second div inside a gradient-filled one, and a gradient fill
	 * behind the content. Both went with the gradients (#428), and what is left
	 * is a single div, so the nesting went too.
	 */
	interface Props {
		borderClass?: string;
		bg?: string;
		/** Corner radius in px. Ignored when `roundedClass` is given. */
		radius?: number;
		roundedClass?: string;
		shadow?: string;
		class?: string;
		children: Snippet;
	}

	let {
		borderClass = '',
		bg = 'bg-white',
		radius = 30,
		roundedClass,
		shadow = '',
		class: className = '',
		children
	}: Props = $props();
</script>

<div
	class={cn('overflow-hidden', roundedClass, bg, borderClass, shadow, className)}
	style={roundedClass ? undefined : `border-radius: ${radius}px;`}
>
	{@render children()}
</div>
