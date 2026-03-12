<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut, elasticOut, backOut } from 'svelte/easing';
	import { AppShell } from '$lib/components/layout';
	import { Header, PopQuiz } from '$lib/components/ui';
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

	const current = $derived(sequence[seqIndex % sequence.length]);
	const card = $derived(current.type === 'learning' ? learningCards[current.index] : null);
	const quiz = $derived(current.type === 'quiz' ? popQuizQuestions[current.index] : null);

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
	if (current.type === 'learning') startCountdown();

	function nextScreen() {
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

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

</script>

<AppShell>
	{#key seqIndex}
	{#if current.type === 'learning' && card}
		<!-- LEARNING / DID YOU KNOW SCREEN -->
		<div class="flex h-full flex-col bg-gradient-primary" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<Header countyName={county.name} />

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
			<div class="flex shrink-0 flex-col gap-2.5 border-t border-background bg-secondary px-7 py-8">
				<button
					disabled={countdown > 0}
					onclick={nextScreen}
					class="flex w-full items-center justify-center rounded-full px-7 py-3.5 font-mono text-lg font-medium transition-colors {countdown > 0
						? 'bg-white/20 text-white/70'
						: 'bg-primary text-primary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]'}"
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
		<div class="flex h-full flex-col bg-gradient-primary overflow-hidden" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<Header countyName={county.name} />
			<PopQuiz quiz={quiz} onContinue={nextScreen} onSkip={nextScreen} />
		</div>
	{/if}
	{/key}
</AppShell>
