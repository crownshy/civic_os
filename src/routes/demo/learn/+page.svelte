<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut, elasticOut, backOut } from 'svelte/easing';
	import { AppShell } from '$lib/components/layout';
	import { county, learningCards, popQuizQuestions } from '$lib/data/mock';

	// Screen types: alternate between learning and quiz
	type ScreenType = 'learning' | 'quiz';

	// Build the sequence: learning, quiz, learning, quiz, ...
	const sequence: { type: ScreenType; index: number }[] = [];
	const maxLen = Math.max(learningCards.length, popQuizQuestions.length);
	for (let i = 0; i < maxLen; i++) {
		if (i < learningCards.length) sequence.push({ type: 'learning', index: i });
		if (i < popQuizQuestions.length) sequence.push({ type: 'quiz', index: i });
	}
	// If more learning cards than quizzes, append remaining
	for (let i = popQuizQuestions.length; i < learningCards.length; i++) {
		if (!sequence.find((s) => s.type === 'learning' && s.index === i)) {
			sequence.push({ type: 'learning', index: i });
		}
	}

	let seqIndex = $state(0);
	let countdown = $state(2);
	let timer: ReturnType<typeof setInterval> | null = null;

	// Quiz state
	let quizSelected = $state<number | null>(null);
	let showCorrectAnim = $state(false);
	let showConfetti = $state(false);

	const current = $derived(sequence[seqIndex % sequence.length]);
	const isLearning = $derived(current.type === 'learning');
	const isQuiz = $derived(current.type === 'quiz');
	const card = $derived(isLearning ? learningCards[current.index] : null);
	const quiz = $derived(isQuiz ? popQuizQuestions[current.index] : null);

	function startCountdown() {
		countdown = 2;
		if (timer) clearInterval(timer);
		timer = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				if (timer) clearInterval(timer);
				timer = null;
			}
		}, 1000);
	}

	function stopCountdown() {
		if (timer) clearInterval(timer);
		timer = null;
	}

	// Start countdown for first screen if it's learning
	if (isLearning) startCountdown();

	function nextScreen() {
		quizSelected = null;
		showCorrectAnim = false;
		showConfetti = false;
		if (seqIndex < sequence.length - 1) {
			seqIndex++;
		} else {
			seqIndex = 0;
		}
		// Start countdown only for learning screens
		if (sequence[seqIndex % sequence.length].type === 'learning') {
			startCountdown();
		} else {
			stopCountdown();
		}
	}

	function selectQuizOption(idx: number) {
		if (quizSelected !== null) return; // Already selected
		quizSelected = idx;
		if (quiz && idx === quiz.correctIndex) {
			// Correct! Trigger celebration
			showCorrectAnim = true;
			setTimeout(() => {
				showConfetti = true;
			}, 200);
		}
	}

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	// Confetti particles
	const confettiColors = ['#07A89E', '#2DD4BF', '#FBBF24', '#FC3AA8', '#818CF8', '#FFFFFF'];
	const confettiParticles = Array.from({ length: 24 }, (_, i) => ({
		id: i,
		color: confettiColors[i % confettiColors.length],
		left: Math.random() * 100,
		delay: Math.random() * 400,
		size: 6 + Math.random() * 8,
		rotation: Math.random() * 360
	}));
</script>

<style>
	@keyframes confetti-fall {
		0% {
			transform: translateY(-20px) rotate(0deg) scale(0);
			opacity: 1;
		}
		15% {
			transform: translateY(0px) rotate(45deg) scale(1.2);
			opacity: 1;
		}
		100% {
			transform: translateY(500px) rotate(720deg) scale(0.3);
			opacity: 0;
		}
	}
	.confetti-piece {
		animation: confetti-fall 2s ease-out forwards;
	}
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

<AppShell>
	{#key seqIndex}
	{#if current.type === 'learning' && card}
		<!-- LEARNING / DID YOU KNOW SCREEN -->
		<div class="flex h-dvh flex-col bg-gradient-to-b from-blue-800 to-blue-900" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<!-- Header -->
			<div class="shrink-0 px-8 pt-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-white/80">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-white bg-teal-400"></span>
						<span class="font-mono text-sm font-medium text-white/80">YOU</span>
					</span>
				</div>
			</div>

			<!-- Content -->
			<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-10">
				<span class="font-mono text-sm font-medium text-white/80">{card.label}</span>
				<p class="mt-4 font-sans text-4xl font-bold leading-10 text-white">
					{card.body || card.title}
				</p>

				<!-- Lorem body text -->
				<p class="mt-10 font-sans text-lg font-medium leading-9 text-white">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis finibus purus mollis, ultrices lorem quis, facilisis mauris. Nulla tortor magna, consequat sed pharetra quis, blandit elementum velit. Curabitur finibus et felis nec vehicula. Vivamus facilisis nunc sed dui ultrices, quis vulputate tellus egestas. Donec in elementum dui. Sed ut placerat nunc.
				</p>
			</div>

			<!-- Bottom: countdown button -->
			<div class="flex shrink-0 flex-col gap-2.5 border-t border-blue-700 bg-blue-900 px-7 py-8">
				<button
					disabled={countdown > 0}
					onclick={nextScreen}
					class="flex w-full items-center justify-center rounded-full px-7 py-3.5 font-mono text-lg font-medium transition-colors {countdown > 0
						? 'bg-white/20 text-white/70'
						: 'bg-teal-500 text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]'}"
				>
					{#if countdown > 0}
						CONTINUE IN {countdown}...
					{:else}
						CONTINUE
					{/if}
				</button>
			</div>
		</div>

	{:else if current.type === 'quiz' && quiz}
		<!-- POP QUIZ SCREEN -->
		<div class="relative flex h-dvh flex-col bg-gradient-to-b from-blue-800 to-blue-900 overflow-hidden" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>

			<!-- Confetti layer -->
			{#if showConfetti}
				<div class="pointer-events-none absolute inset-0 z-50 overflow-hidden">
					{#each confettiParticles as p}
						<div
							class="confetti-piece absolute rounded-sm"
							style="left: {p.left}%; top: -10px; width: {p.size}px; height: {p.size}px; background: {p.color}; animation-delay: {p.delay}ms; transform: rotate({p.rotation}deg);"
						></div>
					{/each}
				</div>
			{/if}

			<!-- Header -->
			<div class="shrink-0 px-8 pt-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-white/80">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-white bg-teal-400"></span>
						<span class="font-mono text-sm font-medium text-white/80">YOU</span>
					</span>
				</div>
			</div>

			<!-- Content -->
			<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-10">
				<span class="font-mono text-sm font-medium text-white/80">{quiz.label}</span>
				<p class="mt-4 font-sans text-4xl font-bold leading-10 text-white">
					{quiz.question}
				</p>

				<!-- Options -->
				<div class="mt-8 flex flex-col gap-2">
					{#each quiz.options as option, i}
						{@const isSelected = quizSelected === i}
						{@const isCorrect = i === quiz.correctIndex}
						{@const answered = quizSelected !== null}
						<button
							onclick={() => selectQuizOption(i)}
							disabled={answered}
							class="relative flex h-16 w-full items-center rounded-[20px] px-6 text-left font-sans text-2xl font-bold leading-7 transition-all duration-300
								{answered && isCorrect
									? 'bg-teal-500 text-white shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
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
				{#if quizSelected !== null}
					<div in:fly={{ y: 20, duration: 400, delay: 300, easing: cubicOut }}>
						<p class="mt-8 font-sans text-lg font-medium leading-9 text-white">
							{quiz.explanation}
						</p>
					</div>
				{/if}
			</div>

			<!-- Bottom actions -->
			<div class="flex shrink-0 items-center gap-3.5 border-t border-blue-700 bg-blue-900 px-7 py-8">
				<button
					onclick={nextScreen}
					class="flex h-14 flex-1 items-center justify-center rounded-full font-mono text-lg font-medium shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] transition-colors {quizSelected !== null
						? 'bg-teal-500 text-white'
						: 'bg-teal-500/50 text-white/70'}"
				>
					CONTINUE
				</button>
				<button
					onclick={nextScreen}
					class="flex h-14 flex-1 items-center justify-center rounded-full bg-black/30 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					SKIP
				</button>
			</div>
		</div>
	{/if}
	{/key}
</AppShell>
