<script lang="ts">
	import { InfoBar, VoteBar } from '$lib/components/ui';
	import type { RegionConfig } from '$lib/config/regions';
	import StatementPlaceholder from './StatementPlaceholder.svelte';

	// Stands in for VotingScreen until Polis has a statement. Built from the real
	// InfoBar, VoteBar and statement placeholder so the layout cannot drift from
	// the screen it becomes. The landing page shows it the moment someone joins,
	// so the skeleton is on screen before `/contribute` is, and the route change
	// underneath is invisible.
	//
	// The Key Question is known before Polis answers, so it renders for real
	// rather than as a bar; only the statement and the remaining count wait.
	let {
		placeName,
		question,
		region
	}: { placeName: string; question: string; region: RegionConfig } = $props();
</script>

<div class="flex h-full flex-col bg-background" aria-busy="true">
	<InfoBar {placeName} {region} skeleton />

	<div class="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-10">
		<div class="absolute top-0 left-0 h-[3px] w-full bg-secondary/30"></div>
		<div class="absolute top-[3px] left-0 flex w-full items-start justify-between px-4 py-2">
			<span class="pr-4 font-mono text-sm font-medium text-muted-foreground/70 uppercase"
				>{question}</span
			>
			<span class="h-5 w-16 shrink-0 animate-pulse rounded bg-muted-foreground/20"></span>
		</div>
		<StatementPlaceholder />
	</div>

	<VoteBar skeleton />
</div>
