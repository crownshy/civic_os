<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		children: import('svelte').Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<!-- Section backgrounds run edge to edge; this keeps the text at a readable width. -->
<div class={cn('relative z-10 mx-auto w-full max-w-5xl', className)}>
	{@render children()}
</div>
