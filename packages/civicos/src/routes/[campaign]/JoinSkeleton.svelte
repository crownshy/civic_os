<script lang="ts">
	import { cn } from '$lib/utils';

	// Stands in for the join CTA while we still do not know whether this is a
	// returning participant. The server answers that from the cookie, but a
	// cached session can only be read after hydration, so an SSR "new visitor"
	// answer is provisional. Geometry mirrors Button size="lg" (h-14).
	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex w-full flex-col items-center', className)} aria-hidden="true">
	<div class="h-14 w-full animate-pulse rounded-full bg-yellow-950/15"></div>
</div>
