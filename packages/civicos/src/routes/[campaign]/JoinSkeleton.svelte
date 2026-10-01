<script lang="ts">
	import { cn } from '$lib/utils';

	// Stands in for the zip field and CTA while we still do not know whether this
	// is a returning participant. The server answers that from the cookie, but a
	// cached session can only be read after hydration, so an SSR "new visitor"
	// answer is provisional and would otherwise visibly flip to CONTINUE.
	// Geometry mirrors ZipInput (h-11 pill) and Button size="lg" (h-14).
	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex w-full flex-col items-center', className)} aria-hidden="true">
	<div class="h-11 w-72 max-w-full animate-pulse rounded-full bg-yellow-950/10"></div>
	<div class="mt-4 h-14 w-full animate-pulse rounded-full bg-yellow-950/15"></div>
</div>
