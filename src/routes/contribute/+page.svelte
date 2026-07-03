<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import { PopQuiz, InfoBar, VoteBar } from '$lib/components/ui';
	import { popQuizQuestions, aboutYouQuestions } from '$lib/data/mock';
	import { getRegionByZipcode } from '$lib/config/regions';
	import type { RegionConfig } from '$lib/config/regions';
	import PolisApi from '$lib/services/polis-api.svelte';
	import { session } from '$lib/services/session.svelte';
	import { config } from '$lib/services/api';
	import VotingScreen from './VotingScreen.svelte';
	import ComposeScreen from './ComposeScreen.svelte';
	import DidYouKnowScreen from './DidYouKnowScreen.svelte';
	import AboutYouScreen from './AboutYouScreen.svelte';
	import NiceJobScreen from './NiceJobScreen.svelte';
	import ThankYouScreen from './ThankYouScreen.svelte';

	// Region from subdomain (layout server load)
	const subdomainRegion: RegionConfig = page.data.region;

	// Resolve which Polis to use based on user's zipcode
	const zipRegion = session.zipCode ? getRegionByZipcode(session.zipCode) : subdomainRegion;
	const polisId = zipRegion.polisId || config.polisId;
	const question = zipRegion.question;

	// Use session user ID for Polis xid (falls back to random if not yet joined)
	const userId = session.userId ?? `bloom-anon-${Math.random().toString(36).slice(2, 8)}`;

	// Pass persisted pid so returning users only see unvoted statements
	let polis = new PolisApi(userId, polisId, 'en', config.polisUrl, session.pid);

	// Sync pid back to session whenever Polis assigns/updates it
	$effect(() => {
		const currentPid = polis.participantId;
		if (currentPid !== undefined && currentPid !== session.pid) {
			session.savePid(currentPid);
		}
	});

	// --- simplified flow ---
	// voting → (after FIRST_BATCH) about-you (demographics, optional) → pause CTA →
	//   voting (SECOND_BATCH more) → ... → END/out of statements → thank-you.
	// Early-enders who never reached FIRST_BATCH still see about-you once at the end.

	type Screen =
		| 'loading'
		| 'voting'
		| 'compose'
		| 'pause'
		| 'about-you'
		| 'thank-you'
		// Preserved but unused in conference flow:
		| 'did-you-know'
		| 'pop-quiz'
		| 'nice-job';

	const FIRST_BATCH = 10;
	const SECOND_BATCH = 20;

	// Returning user: show loading splash until Polis resolves, then decide screen
	const isReturning = session.pid !== undefined;
	const initialScreen: Screen = session.demographicsCompleted && isReturning ? 'loading' : 'voting';
	let screen = $state<Screen>(initialScreen);
	let totalVotes = $state(session.totalVotes);
	let hasSeenPause = $state(session.hasSeenPause);
	let votesInRound = $state(hasSeenPause ? 0 : totalVotes);
	// Tracks when user explicitly pressed END in this session — prevents thank-you→voting loop
	let userEndedVoting = $state(false);
	// Where the demographics screen returns to: the statement-CTA pause when shown at the
	// FIRST_BATCH mark, or thank-you when shown as the end-of-flow fallback.
	let demographicsReturnTo = $state<'pause' | 'thank-you'>('thank-you');

	// Anchor Polis counts once to avoid fluctuation from parallel vote+nextComment requests.
	// After anchoring, we decrement client-side instead of reading polis.remaining directly.
	let anchoredRemaining = $state<number | null>(null);
	let anchoredTotal = $state<number | null>(null);

	$effect(() => {
		if (polis.ready && !polis.loading && anchoredRemaining === null) {
			anchoredRemaining = polis.remaining;
			anchoredTotal = polis.total;
		}
	});

	// Pop quiz state (preserved for future use)
	let quizIndex = $state(0);
	const currentQuiz = $derived(popQuizQuestions[quizIndex % popQuizQuestions.length]);

	// In the first phase, cap displayed remaining/total at FIRST_BATCH.
	// After pause, use anchored counts that decrement client-side (no Polis fluctuation).
	const displayedRemaining = $derived(
		hasSeenPause
			? Math.max(0, anchoredRemaining ?? polis.remaining)
			: Math.max(0, FIRST_BATCH - votesInRound)
	);
	const displayedTotal = $derived(hasSeenPause ? (anchoredTotal ?? polis.total) : FIRST_BATCH);

	// When Polis runs out of statements while voting, go to end flow
	$effect(() => {
		if (screen === 'voting' && polis.ready && !polis.loading && !polis.currentStatement) {
			goToEndFlow();
		}
	});

	// Resolve the loading screen once Polis is ready
	$effect(() => {
		if (screen === 'loading' && polis.ready && !polis.loading) {
			screen = polis.currentStatement ? 'voting' : 'thank-you';
		}
	});

	function handleVote(type: 'agree' | 'disagree' | 'pass') {
		polis.submitVote(type);
		totalVotes++;
		votesInRound++;

		// Decrement anchored remaining so counter is smooth and predictable
		if (anchoredRemaining !== null && anchoredRemaining > 0) {
			anchoredRemaining--;
		}

		// Persist vote progress so it survives page refresh
		session.saveVoteProgress(totalVotes, hasSeenPause);

		const batchLimit = hasSeenPause ? SECOND_BATCH : FIRST_BATCH;
		if (votesInRound >= batchLimit) {
			votesInRound = 0;
			if (!hasSeenPause) {
				// First batch done → demographics (optional), then the statement-CTA pause.
				hasSeenPause = true;
				session.saveVoteProgress(totalVotes, hasSeenPause);
				if (session.demographicsCompleted) {
					screen = 'pause';
				} else {
					demographicsReturnTo = 'pause';
					screen = 'about-you';
				}
			}
			// After second batch, keep voting until they press END or run out
		}
	}

	/** Transition to the ending sequence. Fallback: show demographics here if the user
	 *  ended before FIRST_BATCH and never saw it. */
	function goToEndFlow() {
		userEndedVoting = true;
		if (session.demographicsCompleted) {
			screen = 'thank-you';
		} else {
			demographicsReturnTo = 'thank-you';
			screen = 'about-you';
		}
	}

	function handleEnd() {
		goToEndFlow();
	}

	/** Map age range strings to representative numbers (midpoints) */
	function ageRangeToNumber(ageRange: string): number | undefined {
		const ageMap: Record<string, number> = {
			'Under 18': 16,
			'18 - 24': 21,
			'25 - 34': 29,
			'35 - 44': 39,
			'45 - 54': 49,
			'55 - 64': 59,
			'65 - 84': 74,
			'85+': 85
		};
		return ageMap[ageRange];
	}

	async function handleDemographicsDone(demographics?: {
		age?: string;
		ethnicity?: string;
		gender?: string;
		politicalParty?: string;
	}) {
		// Save demographics to backend profile (awaited so it completes before navigation)
		if (demographics) {
			await session.saveProfile({
				age: demographics.age ? ageRangeToNumber(demographics.age) : undefined,
				ethnicity: demographics.ethnicity || undefined,
				gender: demographics.gender || undefined,
				politicalParty: demographics.politicalParty || undefined
			});
		}

		session.markDemographicsCompleted();
		screen = demographicsReturnTo;
	}

	function resumeVoting() {
		screen = 'voting';
	}

	function handleCompose(text: string, anonymous: boolean) {
		polis.submitStatement(text);
	}

	function handleBackToVoting() {
		userEndedVoting = false;
		screen = 'voting';
	}
</script>

<AppShell>
	{#if screen === 'loading'}
		<div class="flex h-full flex-col items-center justify-center bg-gradient-primary">
			<div class="animate-pulse text-center">
				<span class="font-mono text-base font-medium text-muted-foreground/60 uppercase"
					>LOADING...</span
				>
			</div>
		</div>
	{:else if screen === 'voting'}
		{#if polis.currentStatement}
			<VotingScreen
				countyName={session.county}
				statementText={polis.currentStatement.txt}
				statementId={polis.currentStatement.tid}
				remaining={displayedRemaining}
				total={displayedTotal}
				loading={polis.loading}
				onVote={handleVote}
				onEnd={handleEnd}
				onCompose={() => (screen = 'compose')}
				region={subdomainRegion}
			/>
		{:else}
			<!-- Skeleton that reuses real components so layout stays in sync -->
			<div class="flex h-full flex-col bg-muted">
				<InfoBar countyName={session.county} region={subdomainRegion} />

				<!-- Skeleton statement area -->
				<div class="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8">
					<div class="absolute top-0 left-0 h-[3px] w-full bg-secondary/30"></div>
					<div class="w-full animate-pulse text-left">
						<div class="flex items-center gap-2">
							<span class="h-5 w-5 rounded-full bg-muted-foreground/20"></span>
							<span class="h-4 w-28 rounded bg-muted-foreground/20"></span>
						</div>
						<div class="mt-6 space-y-3">
							<div class="h-8 w-full rounded bg-muted-foreground/10"></div>
							<div class="h-8 w-4/5 rounded bg-muted-foreground/10"></div>
							<div class="h-8 w-3/5 rounded bg-muted-foreground/10"></div>
						</div>
					</div>
				</div>

				<VoteBar skeleton />
			</div>
		{/if}
	{:else if screen === 'compose'}
		<ComposeScreen
			{question}
			countyName={session.county}
			firstVisit={!session.hasSeenComposeInstructions}
			onSubmit={(text, anon) => {
				session.markComposeInstructionsSeen();
				handleCompose(text, anon);
			}}
			onBack={() => {
				session.markComposeInstructionsSeen();
				screen = 'voting';
			}}
			region={subdomainRegion}
		/>
	{:else if screen === 'pause'}
		<NiceJobScreen
			region={subdomainRegion}
			countyName={session.county}
			remaining={anchoredRemaining ?? polis.remaining}
			onKeepVoting={resumeVoting}
			onDone={() => {
				screen = 'compose';
			}}
		/>
	{:else if screen === 'about-you'}
		<AboutYouScreen
			region={subdomainRegion}
			countyName={session.county}
			questions={aboutYouQuestions}
			zipCode={session.zipCode}
			onDone={handleDemographicsDone}
		/>
	{:else if screen === 'thank-you'}
		<ThankYouScreen
			countyName={session.county}
			onBackToVoting={handleBackToVoting}
			region={subdomainRegion}
		/>

		<!-- Preserved screens (unused in conference flow) -->
	{:else if screen === 'did-you-know'}
		<DidYouKnowScreen countyName={session.county} onContinue={resumeVoting} />
	{:else if screen === 'pop-quiz'}
		<div
			class="flex h-full flex-col bg-gradient-primary"
			in:fly={{ x: 40, duration: 400, easing: cubicOut }}
		>
			<InfoBar region={subdomainRegion} countyName={session.county} />
			<PopQuiz quiz={currentQuiz} onContinue={resumeVoting} onSkip={resumeVoting} />
		</div>
	{:else if screen === 'nice-job'}
		<NiceJobScreen
			region={subdomainRegion}
			countyName={session.county}
			onKeepVoting={resumeVoting}
			onDone={handleEnd}
		/>
	{/if}
</AppShell>
