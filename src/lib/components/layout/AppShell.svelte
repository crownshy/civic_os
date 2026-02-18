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
		'app-shell relative min-h-dvh w-full bg-background overflow-x-hidden',
		className
	)}
>
	{@render children()}
</div>

<style>
	/* Page wrappers (1st-level children) stay full-width for bg colors.
	   Content sections (2nd-level children) get constrained on desktop. */
	@media (min-width: 1264px) {
		.app-shell > :global(*) > :global(*) {
			max-width: 1200px;
			margin-left: auto;
			margin-right: auto;
		}
	}
</style>
