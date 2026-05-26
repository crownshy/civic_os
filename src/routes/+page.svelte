<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { AppShell } from '$lib/components/layout';

	onMount(() => {
		goto('/landing');
	});
</script>

<AppShell border={false}>
	<div class="flex h-full flex-col items-center justify-center bg-gradient-primary">
		<div class="animate-pulse text-center">
			<span class="font-mono text-base font-medium uppercase text-muted-foreground/60">LOADING...</span>
		</div>
	</div>
</AppShell>
