<script lang="ts">
	import { navigating } from '$app/state';
	import { activity } from '$lib/activity.svelte';

	// SvelteKit keeps the old page on screen until every `load` for the next one
	// resolves, so without this a slow click reads as a frozen page. Pages that
	// can sketch their destination still render a skeleton; this covers the rest.
	// Saves count too, see `activity`.
</script>

{#if navigating.to || activity.busy}
	<div
		role="progressbar"
		aria-label={navigating.to ? 'Loading page' : 'Saving'}
		class="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
	>
		<div
			class="h-full w-1/4 animate-nav-progress bg-primary motion-reduce:w-full motion-reduce:animate-pulse"
		></div>
	</div>
{/if}
