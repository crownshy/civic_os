<script lang="ts">
	import { goto } from '$app/navigation';
	import { AppShell } from '$lib/components/layout';
	import { PopQuiz } from '$lib/components/ui';
	import { popQuizQuestions } from '$lib/data/mock';

	let quizIndex = $state(0);
	let quizRef = $state<PopQuiz>();
	const currentQuiz = $derived(popQuizQuestions[quizIndex % popQuizQuestions.length]);

	function nextQuiz() {
		if (quizIndex < popQuizQuestions.length - 1) {
			quizIndex++;
			quizRef?.reset();
		} else {
			goto('/demo');
		}
	}
</script>

<AppShell>
	<div class="flex h-dvh flex-col bg-linear-to-b from-blue-800 to-blue-900">
		<PopQuiz
			bind:this={quizRef}
			quiz={currentQuiz}
			onContinue={nextQuiz}
			onSkip={() => goto('/demo')}
		/>
	</div>
</AppShell>
