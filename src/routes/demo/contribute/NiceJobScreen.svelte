<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { BlueHeader, Button } from '$lib/components/ui';

	interface Props {
		countyName: string;
		onKeepVoting: () => void;
		onDone: () => void;
	}

	let { countyName, onKeepVoting, onDone }: Props = $props();
</script>

<div class="flex h-dvh flex-col bg-gradient-primary" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
	<BlueHeader {countyName} />

	<!-- Centered content -->
	<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
		<div class="h-32 w-32 rounded-full bg-secondary"></div>
		<p class="mt-[-90px] text-9xl font-bold drop-shadow-lg">🎉</p>
		<p class="mt-8 text-center font-sans text-3xl font-bold leading-10 text-white">
			Thank you for participating! Here's what's next...
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
