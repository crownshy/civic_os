<script lang="ts">
	import PlaceListing from './PlaceListing.svelte';

	let { data } = $props();
</script>

<PlaceListing placeName={data.placeName} campaigns={data.campaigns} />
