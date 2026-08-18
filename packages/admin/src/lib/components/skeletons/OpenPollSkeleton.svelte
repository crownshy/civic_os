<script lang="ts">
	import InsightsSkeleton from './InsightsSkeleton.svelte';
	import ModerationSkeleton from './ModerationSkeleton.svelte';
	import ParticipantsSkeleton from './ParticipantsSkeleton.svelte';
	import SetupSkeleton from './SetupSkeleton.svelte';

	// `tab` is the sub-tab href suffix ('/setup' | '/participants' | '/moderation' | '/insights').
	let { tab }: { tab: string } = $props();
</script>

{#if tab === '/setup'}
	<SetupSkeleton />
{:else if tab === '/insights'}
	<InsightsSkeleton />
{:else if tab === '/moderation'}
	<ModerationSkeleton />
{:else}
	<ParticipantsSkeleton />
{/if}
