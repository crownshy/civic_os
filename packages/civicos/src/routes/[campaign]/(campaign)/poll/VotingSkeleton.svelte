<script lang="ts">
	import { InfoBar, VoteBar } from '$lib/components/ui';
	import StatementPlaceholder from './StatementPlaceholder.svelte';

	// Stands in for VotingScreen until Polis has a statement. Built from the real
	// InfoBar, VoteBar and statement placeholder so the layout cannot drift from
	// the screen it becomes. The landing page shows it the moment someone joins,
	// so the skeleton is on screen before `/poll` is, and the route change
	// underneath is invisible.
	//
	// The Key Question is known before Polis answers, so it renders for real
	// rather than as a bar; only the statement and the remaining count wait.
	let { placeName, question }: { placeName: string; question: string } = $props();
</script>

<div class="flex h-full flex-col bg-background" aria-busy="true">
	<InfoBar {placeName} skeleton />

	<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
		<div class="h-[3px] w-full shrink-0 bg-secondary/30"></div>
		<div class="flex w-full shrink-0 items-start justify-between px-4 py-2">
			<span class="pr-4 font-mono text-sm font-medium text-muted-foreground/70 uppercase"
				>{question}</span
			>
			<span class="h-5 w-16 shrink-0 animate-pulse rounded bg-muted-foreground/20"></span>
		</div>
		<div class="flex min-h-0 flex-1 flex-col items-center justify-center px-10">
			<StatementPlaceholder />
		</div>
	</div>

	<VoteBar skeleton />
</div>
