<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppShell } from '$lib/components/layout';
	import { county, popQuizQuestions } from '$lib/data/mock';

	let quizIndex = $state(0);
	let quizSelected = $state<number | null>(null);
	const currentQuiz = $derived(popQuizQuestions[quizIndex % popQuizQuestions.length]);

	function nextQuiz() {
		if (quizIndex < popQuizQuestions.length - 1) {
			quizIndex++;
			quizSelected = null;
		} else {
			quizIndex = 0;
			quizSelected = null;
		}
	}
</script>

<AppShell>
	<div class="flex h-dvh flex-col bg-gradient-to-b from-blue-800 to-blue-900">
		<!-- Compact header -->
		<div class="shrink-0 px-8 pt-6">
			<div class="flex items-center justify-between">
				<span class="font-mono text-sm font-medium text-white/80">{county.name}</span>
				<span class="flex items-center gap-2">
					<span class="h-3 w-3 rounded-full border border-white bg-secondary"></span>
					<span class="font-mono text-sm font-medium text-white/80">YOU</span>
				</span>
			</div>
		</div>

		<!-- Scrollable content -->
		<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-8">
			<span class="font-mono text-sm font-medium text-white/80">{currentQuiz.label}</span>
			<p class="mt-4 font-sans text-4xl font-bold leading-10 text-white">
				{currentQuiz.question}
			</p>

			<!-- Options -->
			<div class="mt-8 flex flex-col gap-2">
				{#each currentQuiz.options as option, i}
					<button
						onclick={() => (quizSelected = i)}
						class="flex h-16 w-full items-center rounded-[20px] px-6 text-left font-sans text-2xl font-bold leading-7 transition-colors {quizSelected === i
							? i === currentQuiz.correctIndex
								? 'bg-secondary text-secondary-foreground shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
								: 'bg-white text-blue-800 shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
							: 'bg-blue-900 text-white'}"
					>
						{option}
					</button>
				{/each}
			</div>

			<!-- Explanation (shown after selection) -->
			{#if quizSelected !== null}
				<p class="mt-8 font-sans text-lg font-medium leading-9 text-white" in:fade={{ duration: 300 }}>
					{currentQuiz.explanation}
				</p>
			{/if}
		</div>

		<!-- Bottom actions -->
		<div class="flex shrink-0 items-center gap-3.5 border-t border-primary bg-blue-900 px-7 py-8">
			<button
				onclick={nextQuiz}
				class="flex h-14 flex-1 items-center justify-center rounded-full bg-secondary font-mono text-lg font-medium text-secondary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
			>
				CONTINUE
			</button>
			<a
				href="/demo"
				class="flex h-14 flex-1 items-center justify-center rounded-full bg-black/30 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
			>
				SKIP
			</a>
		</div>
	</div>
</AppShell>
