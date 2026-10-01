<script lang="ts">
	import CampaignLanding from './CampaignLanding.svelte';
	import PlaceListing from './PlaceListing.svelte';

	let { data } = $props();
</script>

{#if data.kind === 'place'}
	<PlaceListing placeName={data.placeName} campaigns={data.campaigns} />
{:else}
	<CampaignLanding />
{/if}
