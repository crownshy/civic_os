<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppShell } from '$lib/components/layout';
	import { PopQuiz, EmailCapture, Header } from '$lib/components/ui';
	import { county, deliberation, popQuizQuestions, aboutYouQuestions } from '$lib/data/mock';
	import PolisApi from '$lib/services/polis-api.svelte';
	import VotingScreen from './VotingScreen.svelte';
	import ComposeScreen from './ComposeScreen.svelte';
	import DidYouKnowScreen from './DidYouKnowScreen.svelte';
	import AboutYouScreen from './AboutYouScreen.svelte';
	import NiceJobScreen from './NiceJobScreen.svelte';
	import ThankYouScreen from './ThankYouScreen.svelte';

	// TODO: These will come from route params / config eventually
	const POLIS_ID = '3itaahejzh';
	const USER_ID = `bloom-user-${Math.random().toString(36).slice(2, 8)}`;

	let polis = new PolisApi(USER_ID, POLIS_ID);

	type Screen =
		| 'voting'
		| 'compose'
		| 'email-capture'
		| 'did-you-know'
		| 'pop-quiz'
		| 'about-you'
		| 'nice-job'
		| 'thank-you';

	let screen = $state<Screen>('voting');
	let votesInRound = $state(0);
	let totalVotes = $state(0);
	const milestoneInterval = 5;

	// Pop quiz state
	let quizIndex = $state(0);
	const currentQuiz = $derived(popQuizQuestions[quizIndex % popQuizQuestions.length]);

	// Interstitial queue: after milestones, cycle through learning types
	let interstitialStep = $state(0);

	$effect(() => {
		if (screen === 'voting' && polis.ready && !polis.loading && !polis.currentStatement) {
			screen = 'thank-you';
		}
	});

	function handleVote(type: 'agree' | 'disagree' | 'pass') {
		polis.submitVote(type);

		totalVotes++;
		votesInRound++;

		if (votesInRound === milestoneInterval) {
			votesInRound = 0;
			interstitialStep++;
			// First interstitial: email capture (shown once)
			if (interstitialStep === 1) {
				screen = 'email-capture';
				return;
			}
			// Then cycle: did-you-know → pop-quiz → nice-job → about-you ...
			const cycle = (interstitialStep - 1) % 4;
			if (cycle === 0) {
				screen = 'did-you-know';
			} else if (cycle === 1) {
				screen = 'pop-quiz';
			} else if (cycle === 2) {
				screen = 'nice-job';
			} else {
				screen = 'about-you';
			}
			return;
		}

		// If Polis has no more statements after this vote, the $effect will transition to thank-you once the API responds
	}

	function handleEnd() {
		screen = 'thank-you';
	}

	function resumeVoting() {
		screen = 'voting';
	}

	function handleCompose(text: string, anonymous: boolean) {
		polis.submitStatement(text);
	}
</script>

<AppShell>
	{#if screen === 'voting'}
		{#if polis.currentStatement}
			<VotingScreen
				countyName={county.name}
				question={deliberation.question}
				statementText={polis.currentStatement.txt}
				remaining={polis.remaining}
				total={polis.total}
				loading={polis.loading}
				onVote={handleVote}
				onEnd={handleEnd}
				onCompose={() => (screen = 'compose')}
			/>
		{:else if polis.loading}
			<div class="flex h-dvh items-center justify-center bg-card">
				<p class="font-mono text-lg text-white/50">Loading...</p>
			</div>
		{/if}

	{:else if screen === 'compose'}
		<ComposeScreen
			question={deliberation.question}
			countyName={county.name}
			onSubmit={handleCompose}
			onBack={() => (screen = 'voting')}
		/>

	{:else if screen === 'email-capture'}
		<div class="flex h-dvh flex-col bg-gradient-primary" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<Header countyName={county.name} />
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
			<Header countyName={county.name} />
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
			onKeepVoting={resumeVoting}
			onDone={handleEnd}
		/>

	{:else if screen === 'thank-you'}
		<ThankYouScreen
			countyName={county.name}
			onContinue={resumeVoting}
			onGoHome={() => {}}
		/>
	{/if}
</AppShell>
