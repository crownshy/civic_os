<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { BlueHeader, Button } from '$lib/components/ui';

	interface Props {
		countyName: string;
		onContinue: () => void;
	}

	let { countyName, onContinue }: Props = $props();

	let countdown = $state(2);
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	function startCountdown() {
		countdown = 2;
		if (countdownInterval) clearInterval(countdownInterval);
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				if (countdownInterval) clearInterval(countdownInterval);
				countdownInterval = null;
			}
		}, 1000);
	}

	startCountdown();
</script>

<div class="flex h-dvh flex-col bg-gradient-primary" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
	<BlueHeader {countyName} />

	<!-- Scrollable content -->
	<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-8">
		<span class="font-mono text-sm font-medium text-white/80">DID YOU KNOW?</span>
		<p class="mt-4 font-sans text-4xl font-bold text-white">
			4 in 5 teenagers in Utah are chatting with AI friends online.
		</p>

		<!-- Body text -->
		<p class="mt-8 font-sans text-lg font-medium leading-9 text-white">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis finibus purus mollis, ultrices lorem quis, facilisis mauris. Nulla tortor magna, consequat sed pharetra quis, blandit elementum velit. Curabitur finibus et felis nec vehicula. Vivamus facilisis nunc sed dui ultrices, quis vulputate tellus egestas.
		</p>
	</div>

	<!-- Sticky bottom actions -->
	<div class="flex shrink-0 flex-col gap-2.5 border-t border-primary bg-blue-900 px-7 py-8">
		<Button
			variant="primary"
			fullWidth
			disabled={countdown > 0}
			onclick={onContinue}
		>
			{#if countdown > 0}
				CONTINUE IN {countdown}...
			{:else}
				CONTINUE
			{/if}
		</Button>
	</div>
</div>
