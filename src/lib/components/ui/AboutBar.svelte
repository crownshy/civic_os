<script lang="ts">
	import AboutOverlay from './AboutOverlay.svelte';

	interface Props {
		countyName: string;
	}

	let { countyName }: Props = $props();

	let showAbout = $state(false);
</script>

<div class="flex items-center justify-between pr-3.75 pl-6 pt-3.75">
	<span class="font-mono text-sm font-medium text-foreground/80">{countyName.toUpperCase()}</span>
	<button
		onclick={() => (showAbout = true)}
		class="flex items-center gap-2.5 overflow-hidden rounded-[20px] bg-white/10 px-1.5 py-0.5"
	>
		<span class="font-mono text-sm font-medium text-white">ABOUT →</span>
	</button>
</div>

{#if showAbout}
	<AboutOverlay onClose={() => (showAbout = false)} />
{/if}
