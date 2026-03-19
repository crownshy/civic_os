<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAnchorAttributes {
		children: Snippet;
		class?: string;
		external?: boolean;
	}

	let { children, class: className, external = false, ...rest }: Props = $props();
</script>

<a
	class={cn('text-destructive underline hover:opacity-80', className)}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	{...rest}
>
	{@render children()}
</a>
