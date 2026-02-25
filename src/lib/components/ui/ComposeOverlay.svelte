<script lang="ts">
	import { cn } from '$lib/utils';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut, cubicOut } from 'svelte/easing';

	interface Props {
		question: string;
		countyName: string;
		onSubmit?: (text: string, anonymous: boolean) => void;
		onBack?: () => void;
		onShowInstructions?: () => void;
		class?: string;
	}

	let {
		question,
		countyName,
		onSubmit,
		onBack,
		onShowInstructions,
		class: className
	}: Props = $props();

	let text = $state('');
	let anonymous = $state(true);
	let submitted = $state(false);
	let showCelebration = $state(false);
	let showConfetti = $state(false);
	const maxChars = 240;
	const charCount = $derived(text.length);
	const overLimit = $derived(charCount > maxChars);
	const canSubmit = $derived(charCount > 0 && charCount <= maxChars && !submitted);

	function handleSubmit() {
		if (!canSubmit) return;
		submitted = true;
		onSubmit?.(text, anonymous);
		// Show celebration after a tiny delay
		setTimeout(() => {
			showCelebration = true;
			setTimeout(() => { showConfetti = true; }, 150);
		}, 300);
	}

	// Confetti particles
	const confettiColors = ['#07A89E', '#2DD4BF', '#FBBF24', '#FC3AA8', '#818CF8', '#FFFFFF'];
	const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
		id: i,
		color: confettiColors[i % confettiColors.length],
		left: Math.random() * 100,
		delay: Math.random() * 500,
		size: 5 + Math.random() * 9,
		rotation: Math.random() * 360
	}));
</script>

<style>
	@keyframes confetti-fall {
		0% { transform: translateY(-20px) rotate(0deg) scale(0); opacity: 1; }
		15% { transform: translateY(0px) rotate(45deg) scale(1.2); opacity: 1; }
		100% { transform: translateY(600px) rotate(720deg) scale(0.3); opacity: 0; }
	}
	.confetti-piece {
		animation: confetti-fall 2.2s ease-out forwards;
	}
</style>

<div class={cn('relative flex h-dvh flex-col bg-background', className)}>
	<!-- Blue gradient card area -->
	<div class="flex flex-1 flex-col rounded-bl-[30px] rounded-br-[30px] bg-gradient-to-b from-blue-800 to-blue-900 shadow-[0px_4px_16.6px_0px_rgba(41,82,192,0.40)]">
		<!-- Header -->
		<div class="flex items-center justify-between px-8 pt-6">
			<span class="font-mono text-sm font-medium text-white/80">{countyName}</span>
			<span class="flex items-center gap-2">
				<span class="h-3 w-3 rounded-full border border-white bg-teal-400"></span>
				<span class="font-mono text-sm font-medium text-white/80">YOU</span>
			</span>
		</div>

		<!-- Question — now Hanken Grotesk -->
		<div class="px-8 pt-6">
			<p class="font-sans text-4xl font-bold leading-10 text-white">
				{question}
			</p>
		</div>

		<!-- Instructions toggle -->
		<div class="px-8 pt-4">
			<button onclick={onShowInstructions} class="font-mono text-sm font-medium text-white/80 hover:text-white transition-colors">
				SHOW INSTRUCTIONS &rarr;
			</button>
		</div>

		<!-- White textarea card -->
		<div class="mx-4 mt-4 flex flex-1 flex-col overflow-hidden rounded-[20px] bg-white shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)] outline outline-2 outline-white">
			<textarea
				bind:value={text}
				placeholder="Type here – what do you think?"
				maxlength={maxChars + 10}
				disabled={submitted}
				class="flex-1 resize-none bg-transparent p-6 font-sans text-2xl font-medium leading-7 text-blue-700 placeholder:text-blue-700/70 border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 appearance-none"
			></textarea>
			<div class="flex items-center justify-between px-5 pt-2 pb-4">
				<span class={cn('font-mono text-sm font-medium', overLimit ? 'text-pink-500' : 'text-blue-700')}>
					{charCount} / {maxChars} CHAR
				</span>
				<button
					onclick={() => (anonymous = !anonymous)}
					class="flex items-center gap-2"
				>
					<span
						class={cn(
							'flex h-5 w-5 items-center justify-center rounded-full',
							anonymous ? 'bg-blue-700' : 'border-2 border-blue-700 bg-transparent'
						)}
					>
						{#if anonymous}
							<svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</span>
					<span class="font-mono text-sm font-medium text-blue-700">SUBMIT ANONYMOUSLY</span>
				</button>
			</div>
		</div>

		<!-- Submit button -->
		<div class="p-4">
			{#if submitted}
				<button
					disabled
					class="flex w-full items-center justify-center rounded-full bg-white/20 px-7 py-3.5 font-mono text-lg font-medium text-white/70"
				>
					SUBMITTED!
				</button>
			{:else}
				<button
					disabled={!canSubmit}
					onclick={handleSubmit}
					class={cn(
						'flex w-full items-center justify-center rounded-full px-7 py-3.5 font-mono text-lg font-medium transition-colors',
						canSubmit
							? 'bg-teal-500 text-white'
							: 'bg-white/20 text-white/70'
					)}
				>
					SUBMIT
				</button>
			{/if}
		</div>
	</div>

	<!-- Back link -->
	<div class="shrink-0 py-4">
		<button
			onclick={onBack}
			class="w-full text-center"
		>
			<span class="rounded-[20px] bg-cyan-100 px-3 py-1.5 font-mono text-base font-medium text-teal-700">
				&lt;&lt; BACK TO THE CONVERSATION
			</span>
		</button>
	</div>

	<!-- Celebration popover overlay -->
	{#if showCelebration}
		<div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-blue-950/90 backdrop-blur-sm" in:fade={{ duration: 250 }}>
			<!-- Confetti -->
			{#if showConfetti}
				<div class="pointer-events-none absolute inset-0 overflow-hidden">
					{#each confettiParticles as p}
						<div
							class="confetti-piece absolute rounded-sm"
							style="left: {p.left}%; top: -10px; width: {p.size}px; height: {p.size}px; background: {p.color}; animation-delay: {p.delay}ms; transform: rotate({p.rotation}deg);"
						></div>
					{/each}
				</div>
			{/if}

			<!-- Card -->
			<div class="relative z-10 mx-6 flex flex-col items-center" in:scale={{ start: 0.8, duration: 500, easing: elasticOut, delay: 100 }}>
				<!-- Emoji circle -->
				<div class="relative mb-6">
					<div class="h-28 w-28 rounded-full bg-teal-400"></div>
					<span class="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-lg">🎉</span>
				</div>

				<div class="w-full rounded-[20px] bg-white p-6">
					<h2 class="text-center font-sans text-3xl font-bold leading-9 text-blue-800">
						Thanks for sharing!
					</h2>
					<p class="mt-3 text-center font-sans text-lg font-medium leading-7 text-blue-800/80">
						Your voice matters. Others will see your statement and vote on it. Keep listening and contributing!
					</p>
				</div>

				<button
					onclick={onBack}
					class="mt-6 flex w-full items-center justify-center rounded-full bg-teal-500 px-7 py-3.5 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					BACK TO THE CONVERSATION
				</button>

				<button
					onclick={() => { showCelebration = false; showConfetti = false; submitted = false; text = ''; }}
					class="mt-3 font-mono text-sm font-medium text-white/70"
				>
					SUBMIT ANOTHER
				</button>
			</div>
		</div>
	{/if}
</div>
