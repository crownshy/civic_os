<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div class={cn('overflow-hidden rounded-xl border border-muted-foreground/20 bg-card', className)}>
	{@render children()}
</div>
