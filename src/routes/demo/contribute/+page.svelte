<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppShell } from '$lib/components/layout';
	import { PopQuiz, EmailCapture, BlueHeader } from '$lib/components/ui';
	import { county, deliberation, statements, popQuizQuestions, aboutYouQuestions } from '$lib/data/mock';
	import VotingScreen from './VotingScreen.svelte';
	import ComposeScreen from './ComposeScreen.svelte';
	import DidYouKnowScreen from './DidYouKnowScreen.svelte';
	import AboutYouScreen from './AboutYouScreen.svelte';
	import NiceJobScreen from './NiceJobScreen.svelte';
	import OnARollScreen from './OnARollScreen.svelte';
	import ThankYouScreen from './ThankYouScreen.svelte';

	type Screen =
		| 'voting'
		| 'compose'
		| 'email-capture'
		| 'did-you-know'
		| 'pop-quiz'
		| 'about-you'
		| 'nice-job'
		| 'on-a-roll'
		| 'thank-you';

	let screen = $state<Screen>('voting');
	let currentIndex = $state(0);
	let votesInRound = $state(0);
	let totalVotes = $state(0);
	const totalStatements = statements.length;
	const milestoneInterval = 5;

	const currentStatement = $derived(statements[currentIndex % totalStatements]);

	// Pop quiz state
	let quizIndex = $state(0);
	const currentQuiz = $derived(popQuizQuestions[quizIndex % popQuizQuestions.length]);

	// Interstitial queue: after milestones, cycle through learning types
	let interstitialStep = $state(0);

	function handleVote(type: 'agree' | 'disagree' | 'skip') {
		totalVotes++;
		votesInRound++;
		currentIndex++;

		if (currentIndex >= totalStatements) {
			screen = 'thank-you';
			return;
		}

		if (votesInRound === milestoneInterval) {
			votesInRound = 0;
			interstitialStep++;
			// First interstitial: email capture (shown once)
			if (interstitialStep === 1) {
				screen = 'email-capture';
				return;
			}
			// Then cycle: did-you-know → pop-quiz → about-you ...
			const cycle = (interstitialStep - 1) % 3;
			if (cycle === 0) {
				screen = 'did-you-know';
			} else if (cycle === 1) {
				screen = 'pop-quiz';
			} else {
				screen = 'about-you';
			}
			return;
		}
	}

	function handleEnd() {
		screen = 'thank-you';
	}

	function resumeVoting() {
		screen = 'voting';
	}

	function continueVoting() {
		currentIndex = 0;
		totalVotes = 0;
		votesInRound = 0;
		screen = 'voting';
	}

	function handleCompose(text: string, anonymous: boolean) {
		// Stay on compose page — user navigates back manually
	}
</script>

<AppShell>
	{#if screen === 'voting'}
		<VotingScreen
			countyName={county.name}
			question={deliberation.question}
			statement={currentStatement}
			{totalVotes}
			{totalStatements}
			{currentIndex}
			onVote={handleVote}
			onEnd={handleEnd}
			onCompose={() => (screen = 'compose')}
		/>

	{:else if screen === 'compose'}
		<ComposeScreen
			question={deliberation.question}
			countyName={county.name}
			onSubmit={handleCompose}
			onBack={() => (screen = 'voting')}
		/>

	{:else if screen === 'email-capture'}
		<div class="flex h-dvh flex-col bg-gradient-primary" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<BlueHeader countyName={county.name} />
			<div class="flex flex-1 flex-col items-center justify-center px-6">
				<EmailCapture
					onSubmit={() => resumeVoting()}
					onSkip={resumeVoting}
				/>
			</div>
		</div>

	{:else if screen === 'did-you-know'}
		<DidYouKnowScreen
			countyName={county.name}
			onContinue={resumeVoting}
		/>

	{:else if screen === 'pop-quiz'}
		<div class="flex h-dvh flex-col bg-gradient-primary" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<BlueHeader countyName={county.name} />
			<PopQuiz quiz={currentQuiz} onContinue={resumeVoting} onSkip={resumeVoting} />
		</div>

	{:else if screen === 'about-you'}
		<AboutYouScreen
			countyName={county.name}
			questions={aboutYouQuestions}
			onDone={resumeVoting}
		/>

	{:else if screen === 'nice-job'}
		<NiceJobScreen
			countyName={county.name}
			onKeepVoting={continueVoting}
			onDone={handleEnd}
		/>

	{:else if screen === 'on-a-roll'}
		<OnARollScreen
			countyName={county.name}
			question={deliberation.question}
			{totalVotes}
			{totalStatements}
			onVote={handleVote}
			onEnd={handleEnd}
			onCompose={() => (screen = 'compose')}
		/>

	{:else if screen === 'thank-you'}
		<ThankYouScreen
			countyName={county.name}
			onContinue={continueVoting}
			onGoHome={() => {}}
		/>
	{/if}
</AppShell>
