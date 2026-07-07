<script lang="ts">
	import EventsSkeleton from './EventsSkeleton.svelte';
	import OverviewSkeleton from './OverviewSkeleton.svelte';
	import OpenPollSkeleton from './OpenPollSkeleton.svelte';
	import Skeleton from './Skeleton.svelte';

	// `tab` is the top-level conversation tab href we're navigating *to*
	// ('overview' | 'open-poll' | 'events'). Renders a skeleton that mirrors the
	// destination's landing page so cross-tab navigation shows instant feedback.
	let { tab }: { tab: string } = $props();
</script>

{#if tab === 'open-poll'}
	<!-- Open Poll redirects to /participants and mounts its own sub-tab layout;
	     sketch the sub-tab strip + participants content it lands on. -->
	<nav class="border-border font-ui flex items-center gap-6 border-b px-5 py-3" aria-hidden="true">
		{#each Array(3) as _, i (i)}
			<Skeleton class="h-4 w-24" />
		{/each}
	</nav>
	<div class="flex-1 overflow-y-auto">
		<div class="px-5 py-5">
			<OpenPollSkeleton tab="/participants" />
		</div>
	</div>
{:else if tab === 'events'}
	<EventsSkeleton />
{:else}
	<OverviewSkeleton />
{/if}
