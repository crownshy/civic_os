<script lang="ts">
	import { InfoBar, VoteBar } from '$lib/components/ui';
	import type { RegionConfig } from '$lib/config/regions';

	// Stands in for VotingScreen until Polis has a statement. Built from the real
	// InfoBar and VoteBar so the layout cannot drift from the screen it becomes.
	// The landing page shows it the moment someone joins, so the skeleton is on
	// screen before `/contribute` is, and the route change underneath is invisible.
	let { placeName, region }: { placeName: string; region: RegionConfig } = $props();
</script>

<div class="flex h-full flex-col bg-background" aria-busy="true">
	<InfoBar {placeName} {region} />

	<div class="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8">
		<div class="absolute top-0 left-0 h-[3px] w-full bg-secondary/30"></div>
		<div class="w-full animate-pulse text-left">
			<div class="flex items-center gap-2">
				<span class="h-5 w-5 rounded-full bg-muted-foreground/20"></span>
				<span class="h-4 w-28 rounded bg-muted-foreground/20"></span>
			</div>
			<div class="mt-6 space-y-3">
				<div class="h-8 w-full rounded bg-muted-foreground/10"></div>
				<div class="h-8 w-4/5 rounded bg-muted-foreground/10"></div>
				<div class="h-8 w-3/5 rounded bg-muted-foreground/10"></div>
			</div>
		</div>
	</div>

	<VoteBar skeleton />
</div>
