<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import { cubicOut, elasticOut } from 'svelte/easing';
	import ConfettiOverlay from './ConfettiOverlay.svelte';
	import type { PopQuizQuestion } from '$lib/types/mock-data';

	interface Props {
		quiz: PopQuizQuestion;
		/** Called when user clicks CONTINUE or SKIP */
		onContinue?: () => void;
		onSkip?: () => void;
		class?: string;
	}

	let { quiz, onContinue, onSkip, class: className = '' }: Props = $props();

	let selected = $state<number | null>(null);
	let showCorrectAnim = $state(false);
	let showConfetti = $state(false);

	function selectOption(idx: number) {
		if (selected !== null) return;
		selected = idx;
		if (idx === quiz.correctIndex) {
			showCorrectAnim = true;
			setTimeout(() => { showConfetti = true; }, 200);
		}
	}

	export function reset() {
		selected = null;
		showCorrectAnim = false;
		showConfetti = false;
	}
</script>

<style>
	@keyframes pulse-glow {
		0%, 100% { box-shadow: 0 0 0 0 rgba(7, 168, 158, 0.4); }
		50% { box-shadow: 0 0 0 12px rgba(7, 168, 158, 0); }
	}
	.correct-glow {
		animation: pulse-glow 0.8s ease-in-out 2;
	}
	@keyframes check-draw {
		0% { stroke-dashoffset: 24; }
		100% { stroke-dashoffset: 0; }
	}
	.check-animate {
		stroke-dasharray: 24;
		animation: check-draw 0.4s ease-out 0.2s forwards;
		stroke-dashoffset: 24;
	}
</style>

<div class="relative flex flex-1 flex-col overflow-hidden {className}">
	<!-- Confetti layer -->
	<ConfettiOverlay active={showConfetti} />

	<!-- Content -->
	<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-10">
		<span class="font-mono text-sm font-medium text-white/80">{quiz.label}</span>
		<p class="mt-4 font-sans text-4xl font-bold leading-10 text-white">
			{quiz.question}
		</p>

		<!-- Options -->
		<div class="mt-8 flex flex-col gap-2">
			{#each quiz.options as option, i}
				{@const isSelected = selected === i}
				{@const isCorrect = i === quiz.correctIndex}
				{@const answered = selected !== null}
				<button
					onclick={() => selectOption(i)}
					disabled={answered}
					class="relative flex h-16 w-full items-center rounded-[20px] px-6 text-left font-sans text-2xl font-bold leading-7 transition-all duration-300
						{answered && isCorrect
							? 'bg-secondary text-secondary-foreground shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
							: isSelected && !isCorrect
								? 'bg-white/30 text-white'
								: answered
									? 'bg-blue-900/60 text-white/50'
									: 'bg-blue-900 text-white'}
						{answered && isCorrect && showCorrectAnim ? 'correct-glow' : ''}"
				>
					{#if answered && isCorrect}
						<span class="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/30" in:scale={{ duration: 400, easing: elasticOut }}>
							<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path class="check-animate" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</span>
					{/if}
					{#if answered && isSelected && !isCorrect}
						<span class="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20" in:scale={{ duration: 300 }}>
							<svg class="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</span>
					{/if}
					{option}
				</button>
			{/each}
		</div>

		<!-- Explanation (shown after selection) -->
		{#if selected !== null}
			<div in:fly={{ y: 20, duration: 400, delay: 300, easing: cubicOut }}>
				<p class="mt-8 font-sans text-lg font-medium leading-9 text-white">
					{quiz.explanation}
				</p>
			</div>
		{/if}
	</div>

	<!-- Bottom actions -->
	<div class="flex shrink-0 items-center gap-3.5 border-t border-primary bg-blue-900 px-7 py-8">
		<button
			onclick={onContinue}
			class="flex h-14 flex-1 items-center justify-center rounded-full font-mono text-lg font-medium shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] transition-colors {selected !== null
				? 'bg-secondary text-secondary-foreground'
				: 'bg-secondary/50 text-white/70'}"
		>
			CONTINUE
		</button>
		<button
			onclick={onSkip}
			class="flex h-14 flex-1 items-center justify-center rounded-full bg-black/30 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
		>
			SKIP
		</button>
	</div>
</div>
