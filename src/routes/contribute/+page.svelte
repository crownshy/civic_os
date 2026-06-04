<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import {
		PopQuiz,
		InfoBar,
		VoteBar,
		ActionPanel,
		EmailPanelContent,
		SharePanelContent,
		ReviewPanelContent
	} from '$lib/components/ui';
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
	import CheckpointScreen, { type CheckpointVariant } from './CheckpointScreen.svelte';
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
	// voting → (every BATCH_SIZE votes) pause → voting → ...
	// END at any point or out of statements → about-you → email-capture (if needed) → thank-you

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

	const BATCH_SIZE = 10;
	// Order of checkpoints. Index i fires after vote (i+1) * BATCH_SIZE.
	//   index 0 → vote 10 → 'contribute'  (no done-flag; always fires)
	//   index 1 → vote 20 → 'email'       (skipped if session.emailProvided)
	//   index 2 → vote 30 → 'feedback'    (skipped if session.endCtaReviewCompleted)
	//   index 3 → vote 40 → 'share'       (skipped if session.endCtaShareCompleted)
	// Past vote 40: no more pauses.
	const CHECKPOINT_VARIANTS: CheckpointVariant[] = ['contribute', 'email', 'feedback', 'share'];

	/** Whether a checkpoint variant should be skipped because its action is already done. */
	function isCheckpointAlreadyDone(variant: CheckpointVariant): boolean {
		switch (variant) {
			case 'contribute':
				return false; // composing is repeatable; always show
			case 'email':
				return session.emailProvided;
			case 'feedback':
				return session.endCtaReviewCompleted;
			case 'share':
				return session.endCtaShareCompleted;
		}
	}

	// Returning user: show loading splash until Polis resolves, then decide screen
	const isReturning = session.pid !== undefined;
	const initialScreen: Screen = session.demographicsCompleted && isReturning ? 'loading' : 'voting';
	let screen = $state<Screen>(initialScreen);
	let totalVotes = $state(session.totalVotes);
	let hasSeenPause = $state(session.hasSeenPause);
	let votesInRound = $state(hasSeenPause ? 0 : totalVotes);
	// Checkpoints reached so far (1..4). Drives which variant the pause shows.
	let checkpointsReached = $state(Math.floor(totalVotes / BATCH_SIZE));
	const currentVariant: CheckpointVariant = $derived(
		CHECKPOINT_VARIANTS[Math.min(checkpointsReached, CHECKPOINT_VARIANTS.length) - 1] ?? 'contribute'
	);
	// Tracks when user explicitly pressed END in this session — prevents thank-you→voting loop
	let userEndedVoting = $state(false);

	// Checkpoint action panels (also reused on the end-page ThankYouScreen)
	let emailPanelOpen = $state(false);
	let sharePanelOpen = $state(false);
	let reviewPanelOpen = $state(false);

	function handleCheckpointPrimary() {
		switch (currentVariant) {
			case 'contribute':
				screen = 'compose';
				break;
			case 'email':
				emailPanelOpen = true;
				break;
			case 'feedback':
				reviewPanelOpen = true;
				break;
			case 'share':
				sharePanelOpen = true;
				break;
		}
	}

	/** Called by panel content components when the user completes the action. Closes panel + resumes voting.
	 * Order matters: swap to voting *before* closing the panel so the panel's slide-down animation
	 * reveals the voting screen underneath instead of flashing the checkpoint screen behind it. */
	function handlePanelComplete() {
		resumeVoting();
		emailPanelOpen = false;
		sharePanelOpen = false;
		reviewPanelOpen = false;
	}

	// Pop quiz state (preserved for future use)
	let quizIndex = $state(0);
	const currentQuiz = $derived(popQuizQuestions[quizIndex % popQuizQuestions.length]);

	// Progress bar reflects current batch of BATCH_SIZE votes.
	const displayedRemaining = $derived(Math.max(0, BATCH_SIZE - votesInRound));
	const displayedTotal = BATCH_SIZE;

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

		// Persist vote progress so it survives page refresh
		session.saveVoteProgress(totalVotes, hasSeenPause);

		if (votesInRound >= BATCH_SIZE) {
			votesInRound = 0;
			checkpointsReached++;
			if (!hasSeenPause) {
				hasSeenPause = true;
				session.saveVoteProgress(totalVotes, hasSeenPause);
			}
			if (checkpointsReached <= CHECKPOINT_VARIANTS.length) {
				// Skip if the action this checkpoint promotes is already done (e.g. email already given).
				// Contribute always shows; email/feedback/share defer to session flags.
				const variant = CHECKPOINT_VARIANTS[checkpointsReached - 1];
				if (!isCheckpointAlreadyDone(variant)) {
					screen = 'pause';
				}
			}
			// Past the last checkpoint: keep voting, no more pauses.
		}
	}

	/** Transition to the ending sequence: demographics → email → thank-you */
	function goToEndFlow() {
		userEndedVoting = true;
		if (session.demographicsCompleted) {
			screen = 'thank-you';
		} else {
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
		screen = 'thank-you';
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
				realRemaining={polis.remaining}
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
		<CheckpointScreen
			region={subdomainRegion}
			countyName={session.county}
			variant={currentVariant}
			remaining={polis.remaining}
			onPrimary={handleCheckpointPrimary}
			onKeepGoing={resumeVoting}
			onEnd={handleEnd}
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
		<CheckpointScreen
			region={subdomainRegion}
			countyName={session.county}
			onPrimary={handleEnd}
			onKeepGoing={resumeVoting}
		/>
	{/if}
</AppShell>

<!-- Checkpoint action panels (also reused on the end-page ThankYouScreen) -->
<ActionPanel
	bind:open={emailPanelOpen}
	title={session.emailProvided ? "You're on the list." : 'Stay in touch.'}
	description={session.emailProvided
		? 'Thanks — we’ll be in touch with updates on this conversation.'
		: 'Share your email to receive updates on this conversation and opportunities to share your voice on this issue.'}
	umamiDismissEvent="checkpoint-panel-dismiss-email"
>
	<EmailPanelContent
		umamiSubmitEvent="checkpoint-email-submit"
		onComplete={handlePanelComplete}
	/>
</ActionPanel>

<ActionPanel
	bind:open={sharePanelOpen}
	title="Help bring everyone into the fold."
	umamiDismissEvent="checkpoint-panel-dismiss-share"
>
	<SharePanelContent
		region={subdomainRegion}
		umamiTextEvent="checkpoint-share-text"
		umamiEmailEvent="checkpoint-share-email"
		umamiLinkEvent="checkpoint-share-link"
		onComplete={handlePanelComplete}
	/>
</ActionPanel>

<ActionPanel
	bind:open={reviewPanelOpen}
	title="Rate your experience."
	description="Tell us what worked, what didn’t, and what would make this better."
	umamiDismissEvent="checkpoint-panel-dismiss-review"
	class="md:w-[560px]"
>
	<ReviewPanelContent
		umamiSubmitEvent="checkpoint-review-submit"
		onComplete={handlePanelComplete}
	/>
</ActionPanel>
