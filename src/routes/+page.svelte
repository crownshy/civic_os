<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/demo');
	});
</script>

<p class="p-8 font-mono text-primary">Redirecting to demo...</p>
