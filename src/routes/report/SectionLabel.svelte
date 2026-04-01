<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		children: import('svelte').Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div
	class={cn(
		'inline-flex items-center rounded-full bg-secondary/10 px-3 py-2 font-mono text-sm font-medium uppercase text-foreground',
		className
	)}
>
	{@render children()}
</div>
