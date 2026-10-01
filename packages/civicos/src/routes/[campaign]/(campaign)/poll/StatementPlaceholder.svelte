<script lang="ts">
	import { fade } from 'svelte/transition';

	// The pulsing stand-in for a statement, shaped like the real quote block in
	// VotingScreen: same margins, same line pitch (text-3xl / leading-tight), same
	// tint as the text it becomes. Shared with VotingSkeleton so the two cannot
	// drift apart from the screen they both stand in for, which means neither can
	// wrap it in anything: the wrapper would move the bars off the quote.
	//
	// `fadeIn` is for the gap between statements, where this replaces text that
	// was just there. The standalone skeleton is the first paint and has nothing
	// to fade in from.
	let { fadeIn = false }: { fadeIn?: boolean } = $props();
</script>

<div class="mt-6 w-full text-left" aria-hidden="true" in:fade={{ duration: fadeIn ? 200 : 0 }}>
	<div class="mt-6 animate-pulse space-y-[7.5px]">
		<div class="h-[30px] w-full rounded bg-muted-foreground/10"></div>
		<div class="h-[30px] w-4/5 rounded bg-muted-foreground/10"></div>
		<div class="h-[30px] w-3/5 rounded bg-muted-foreground/10"></div>
	</div>
</div>
