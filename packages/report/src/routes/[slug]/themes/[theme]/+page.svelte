<script lang="ts">
	import ThemePage from '$lib/components/ThemePage.svelte';

	let { data } = $props();
</script>

<ThemePage theme={data.theme} />
