<script lang="ts">
	import InsightsSkeleton from './InsightsSkeleton.svelte';
	import ModerationSkeleton from './ModerationSkeleton.svelte';
	import ParticipantsSkeleton from './ParticipantsSkeleton.svelte';

	// `tab` is the sub-tab href suffix ('/participants' | '/moderation' | '/insights').
	let { tab }: { tab: string } = $props();
</script>

{#if tab === '/insights'}
	<InsightsSkeleton />
{:else if tab === '/moderation'}
	<ModerationSkeleton />
{:else}
	<ParticipantsSkeleton />
{/if}
