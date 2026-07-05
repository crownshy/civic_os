<script lang="ts">
	// Low-level shimmer block. Compose these to sketch a page's layout while its
	// `load` function is still resolving.
	let { class: className = '' }: { class?: string } = $props();
</script>

<div class={`bg-muted-foreground/15 animate-pulse rounded-md ${className}`}></div>
