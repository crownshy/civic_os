<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/stores';
	import { AppShell } from '$lib/components/layout';
	import { PopQuiz, EmailCapture, AboutBar } from '$lib/components/ui';
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

	// --- simplified flow ---
	// voting → (after FIRST_BATCH) pause → voting (SECOND_BATCH more) → ...
	// END at any point or out of statements → about-you → email-capture (if needed) → thank-you

	type Screen =
		| 'voting'
		| 'compose'
		| 'pause'
		| 'about-you'
		| 'email-capture'
		| 'thank-you'
		// Preserved but unused in conference flow:
		| 'did-you-know'
		| 'pop-quiz'
		| 'nice-job';

	const FIRST_BATCH = 10;
	const SECOND_BATCH = 20;

	let screen = $state<Screen>('voting');
	let votesInRound = $state(0);
	let totalVotes = $state(0);
	let hasSeenPause = $state(false);

	// Read landing page params
	const emailFromLanding = $derived($page.url.searchParams.get('email') === 'true');
	const zipFromLanding = $derived($page.url.searchParams.get('zip') ?? '');
	let emailProvided = $state(false);
	$effect(() => { if (emailFromLanding) emailProvided = true; });

	// Pop quiz state (preserved for future use)
	let quizIndex = $state(0);
	const currentQuiz = $derived(popQuizQuestions[quizIndex % popQuizQuestions.length]);

	// When Polis runs out of statements while voting, go to end flow
	$effect(() => {
		if (screen === 'voting' && polis.ready && !polis.loading && !polis.currentStatement) {
			goToEndFlow();
		}
	});

	function handleVote(type: 'agree' | 'disagree' | 'pass') {
		polis.submitVote(type);
		totalVotes++;
		votesInRound++;

		const batchLimit = hasSeenPause ? SECOND_BATCH : FIRST_BATCH;
		if (votesInRound >= batchLimit) {
			votesInRound = 0;
			if (!hasSeenPause) {
				// First batch done → soft pause
				hasSeenPause = true;
				screen = 'pause';
			}
			// After second batch, keep voting until they press END or run out
		}
	}

	/** Transition to the ending sequence: demographics → email → thank-you */
	function goToEndFlow() {
		screen = 'about-you';
	}

	function handleEnd() {
		goToEndFlow();
	}

	function handleDemographicsDone() {
		// if (!emailProvided) {
		// 	screen = 'email-capture';
		// } else {
			screen = 'thank-you';
		// }
	}

	function handleEmailSubmit(email: string) {
		emailProvided = true;
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
			<div class="flex h-full items-center justify-center bg-card">
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

	{:else if screen === 'pause'}
		<NiceJobScreen
			countyName={county.name}
			remaining={polis.remaining}
			onKeepVoting={resumeVoting}
			onDone={goToEndFlow}
		/>

	{:else if screen === 'about-you'}
		<AboutYouScreen
			countyName={county.name}
			questions={aboutYouQuestions}
			zipCode={zipFromLanding}
			onDone={handleDemographicsDone}
		/>

	{:else if screen === 'email-capture'}
		<div class="flex h-full flex-col bg-gradient-primary" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<AboutBar countyName={county.name} />
			<div class="flex flex-1 flex-col items-center justify-center px-6">
				<EmailCapture
					onSubmit={handleEmailSubmit}
					onSkip={() => { screen = 'thank-you'; }}
				/>
			</div>
		</div>

	{:else if screen === 'thank-you'}
		<ThankYouScreen
			countyName={county.name}
			onContinue={resumeVoting}
			onGoHome={() => {}}
		/>

	<!-- Preserved screens (unused in conference flow) -->
	{:else if screen === 'did-you-know'}
		<DidYouKnowScreen
			countyName={county.name}
			onContinue={resumeVoting}
		/>
	{:else if screen === 'pop-quiz'}
		<div class="flex h-full flex-col bg-gradient-primary" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<AboutBar countyName={county.name} />
			<PopQuiz quiz={currentQuiz} onContinue={resumeVoting} onSkip={resumeVoting} />
		</div>
	{:else if screen === 'nice-job'}
		<NiceJobScreen
			countyName={county.name}
			onKeepVoting={resumeVoting}
			onDone={handleEnd}
		/>
	{/if}
</AppShell>
