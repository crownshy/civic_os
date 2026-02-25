<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Header, Button } from '$lib/components/ui';

	interface Props {
		countyName: string;
		onKeepVoting: () => void;
		onDone: () => void;
	}

	let { countyName, onKeepVoting, onDone }: Props = $props();
</script>

<div class="flex h-dvh flex-col bg-gradient-primary" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
	<Header {countyName} />

	<!-- Centered content -->
	<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
		<div class="relative shrink-0">
			<div class="h-30 w-30 rounded-full bg-secondary"></div>
			<span class="absolute inset-0 flex items-center justify-center text-9xl drop-shadow-[0px_4px_24px_rgba(0,0,0,0.25)]">🎉</span>
		</div>
		<p class="mt-8 text-center font-sans text-3xl font-bold leading-10 text-white">
			Nice job!
		</p>
	</div>

	<!-- Bottom CTAs -->
	<div class="flex shrink-0 items-center gap-3.5 border-t border-primary bg-blue-900 px-7 py-8">
		<Button variant="primary" fullWidth onclick={onKeepVoting}>
			KEEP VOTING
		</Button>
		<Button variant="secondary" fullWidth onclick={onDone}>
			I'M DONE
		</Button>
	</div>
</div>
