<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppShell, AppHeader } from '$lib/components/layout';
	import { VoteBar, PillButton } from '$lib/components/ui';
	import ComposeOverlay from '$lib/components/ui/ComposeOverlay.svelte';
	import { county, deliberation, statements, learningCards, popQuizQuestions, aboutYouQuestions } from '$lib/data/mock';

	type Screen =
		| 'voting'
		| 'compose'
		| 'did-you-know'
		| 'pop-quiz'
		| 'about-you'
		| 'nice-job'
		| 'on-a-roll'
		| 'thank-you';

	let screen = $state<Screen>('voting');
	let showInstructions = $state(false);
	let currentIndex = $state(0);
	let votesInRound = $state(0);
	let totalVotes = $state(0);
	const totalStatements = statements.length;
	const milestoneInterval = 5;

	// Swipe state for voting
	let swipeStartX = $state(0);
	let swipeStartY = $state(0);
	let swipeDeltaX = $state(0);
	let swiping = $state(false);
	let swipeDirection = $state<'none' | 'agree' | 'disagree'>('none');
	let swipeDismissed = $state(false);

	const SWIPE_THRESHOLD = 80;

	function handleSwipeStart(e: TouchEvent) {
		if (swipeDismissed) return;
		swipeStartX = e.touches[0].clientX;
		swipeStartY = e.touches[0].clientY;
		swipeDeltaX = 0;
		swiping = true;
		swipeDirection = 'none';
	}

	function handleSwipeMove(e: TouchEvent) {
		if (!swiping || swipeDismissed) return;
		const dx = e.touches[0].clientX - swipeStartX;
		const dy = e.touches[0].clientY - swipeStartY;
		// Only track horizontal swipes
		if (Math.abs(dx) > Math.abs(dy) * 1.2) {
			swipeDeltaX = dx;
			swipeDirection = dx > SWIPE_THRESHOLD ? 'agree' : dx < -SWIPE_THRESHOLD ? 'disagree' : 'none';
		}
	}

	function handleSwipeEnd() {
		if (!swiping || swipeDismissed) return;
		swiping = false;
		if (swipeDirection === 'agree') {
			swipeDismissed = true;
			setTimeout(() => {
				handleVote('agree');
				swipeDeltaX = 0;
				swipeDirection = 'none';
				swipeDismissed = false;
			}, 200);
		} else if (swipeDirection === 'disagree') {
			swipeDismissed = true;
			setTimeout(() => {
				handleVote('disagree');
				swipeDeltaX = 0;
				swipeDirection = 'none';
				swipeDismissed = false;
			}, 200);
		} else {
			swipeDeltaX = 0;
			swipeDirection = 'none';
		}
	}

	const currentStatement = $derived(statements[currentIndex % totalStatements]);

	// Adaptive font: short → Hanken big, medium → Hanken mid, long → Hanken smaller
	const statementClasses = $derived.by(() => {
		const len = currentStatement.text.length;
		if (len < 60) return 'font-sans text-5xl font-bold leading-[1.1]';
		if (len < 140) return 'font-sans text-3xl font-semibold leading-10';
		return 'font-sans text-2xl font-medium leading-8';
	});

	// Countdown timer for interstitials
	let countdown = $state(2);
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	function startCountdown() {
		countdown = 2;
		if (countdownInterval) clearInterval(countdownInterval);
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				if (countdownInterval) clearInterval(countdownInterval);
				countdownInterval = null;
			}
		}, 1000);
	}

	// Pop quiz state
	let quizIndex = $state(0);
	let quizSelected = $state<number | null>(null);
	const currentQuiz = $derived(popQuizQuestions[quizIndex % popQuizQuestions.length]);

	// About you state
	let aboutIndex = $state(0);
	let aboutSelections = $state<Set<number>>(new Set());
	const currentAbout = $derived(aboutYouQuestions[aboutIndex % aboutYouQuestions.length]);

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
			// Cycle: did-you-know → pop-quiz → about-you → did-you-know ...
			const cycle = interstitialStep % 3;
			if (cycle === 1) {
				screen = 'did-you-know';
				startCountdown();
			} else if (cycle === 2) {
				quizSelected = null;
				screen = 'pop-quiz';
			} else {
				aboutSelections = new Set();
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

	// Report Back carousel state
	const reportSlides = [
		{ title: 'Report Back', body: 'This is a place-based conversation about how we should regulate social media to minimize its harms for ourselves and those we care about.' },
		{ title: 'What We Heard', body: 'Participants broadly agreed on the need for digital literacy education and stronger platform accountability, with nuanced views on parental controls.' },
		{ title: 'What\'s Next', body: 'Results from this conversation will be shared with local officials and community organizations to help inform policy decisions in Utah County.' }
	];
	let reportSlideIndex = $state(0);
	let reportTouchStartX = $state(0);
	let reportTouchDelta = $state(0);
	let reportSwiping = $state(false);

	function handleReportTouchStart(e: TouchEvent) {
		reportTouchStartX = e.touches[0].clientX;
		reportTouchDelta = 0;
		reportSwiping = true;
	}
	function handleReportTouchMove(e: TouchEvent) {
		if (!reportSwiping) return;
		reportTouchDelta = e.touches[0].clientX - reportTouchStartX;
	}
	function handleReportTouchEnd() {
		if (!reportSwiping) return;
		reportSwiping = false;
		if (reportTouchDelta < -40 && reportSlideIndex < reportSlides.length - 1) {
			reportSlideIndex++;
		} else if (reportTouchDelta > 40 && reportSlideIndex > 0) {
			reportSlideIndex--;
		}
		reportTouchDelta = 0;
	}

	function toggleAboutSelection(idx: number) {
		const next = new Set(aboutSelections);
		if (currentAbout.multiSelect) {
			if (next.has(idx)) next.delete(idx);
			else next.add(idx);
		} else {
			next.clear();
			next.add(idx);
		}
		aboutSelections = next;
	}
</script>

<AppShell>
	{#if screen === 'voting'}
		<!-- Voting screen -->
		<div class="flex h-dvh flex-col bg-background" in:fly={{ x: -40, duration: 350, easing: cubicOut }}>
			<AppHeader
				countyName={county.name}
				question={deliberation.question}
				variant="on-primary"
				rounded
				shareInput
				onShareClick={() => (screen = 'compose')}
				backHref="/demo"
				class="shrink-0"
			/>

			<!-- Swipeable statement content -->
			<div
				class="relative flex flex-1 flex-col overflow-hidden px-8 pt-6"
				ontouchstart={handleSwipeStart}
				ontouchmove={handleSwipeMove}
				ontouchend={handleSwipeEnd}
				role="region"
				aria-label="Swipe to vote"
			>
				<!-- Swipe direction labels -->
				{#if swiping && Math.abs(swipeDeltaX) > 30}
					<div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-4">
						<span
							class="rounded-full px-4 py-2 font-mono text-sm font-medium transition-opacity {swipeDirection === 'disagree' ? 'bg-blue-900 text-white opacity-100' : 'opacity-0'}"
						>
							DISAGREE
						</span>
						<span
							class="rounded-full px-4 py-2 font-mono text-sm font-medium transition-opacity {swipeDirection === 'agree' ? 'bg-teal-500 text-white opacity-100' : 'opacity-0'}"
						>
							AGREE
						</span>
					</div>
				{/if}

				{#key currentIndex}
					<div
						class="transition-transform {swiping ? 'duration-0' : 'duration-300'}"
						style="transform: translateX({swipeDismissed ? (swipeDirection === 'agree' ? 400 : -400) : swipeDeltaX}px) rotate({swipeDismissed ? (swipeDirection === 'agree' ? 8 : -8) : swipeDeltaX * 0.04}deg); opacity: {swipeDismissed ? 0 : 1}"
						in:fly={{ y: 20, duration: 300, easing: cubicOut }}
					>
						<!-- Attribution -->
						<div class="flex items-center gap-2">
							<span
								class="h-5 w-5 rounded-full"
								style="background-color: {currentStatement.authorColor ?? '#2952C0'}"
							></span>
							<span
								class="font-mono text-sm font-medium text-blue-700"
							>
								{currentStatement.authorAlias} SAYS...
							</span>
						</div>

						<!-- Quote with adaptive font — now Hanken Grotesk -->
						<p class="mt-4 {statementClasses} text-blue-700">
							{currentStatement.text}
						</p>
					</div>
				{/key}
			</div>

			<!-- Sticky bottom VoteBar -->
			<div class="shrink-0 w-full">
				<VoteBar
					onAgree={() => handleVote('agree')}
					onDisagree={() => handleVote('disagree')}
					onSkip={() => handleVote('skip')}
					onEnd={handleEnd}
					current={totalVotes}
					total={totalStatements}
				/>
			</div>
		</div>

	{:else if screen === 'compose'}
		<!-- Compose / share thoughts screen -->
		<div class="relative" in:fly={{ y: 100, duration: 400, easing: cubicOut }}>
			<ComposeOverlay
				question={deliberation.question}
				countyName={county.name}
				onSubmit={handleCompose}
				onBack={() => (screen = 'voting')}
				onShowInstructions={() => (showInstructions = true)}
			/>

			{#if showInstructions}
				<!-- Instructions overlay on top of compose -->
				<div class="absolute inset-0 z-50 bg-blue-950/90 backdrop-blur-[2.65px] flex flex-col items-center justify-center px-4" in:fade={{ duration: 200 }}>
					<div class="w-full rounded-[20px] bg-white p-6 outline outline-2 outline-white overflow-hidden">
						<h2 class="font-sans text-4xl font-bold leading-10 text-blue-800">
							How to contribute to this conversation:
						</h2>
						<div class="mt-6 h-1.5 w-14 bg-teal-400 rounded-full"></div>
						<div class="mt-6 font-sans text-lg font-medium leading-7 text-blue-900">
							<p>You can share ideas, opinions, values, or whatever else. Others will see these and vote on them.</p>
							<br />
							<p>You are contributing standalone statements – not responding to specific statements you see in the conversation.</p>
							<br />
							<p>No profanity, threats, etc.</p>
							<br />
							<p>You can submit as many statements as you'd like, but remember to listen!</p>
						</div>
					</div>
					<div class="mt-6 w-full px-2">
						<button
							onclick={() => (showInstructions = false)}
							class="flex w-full items-center justify-center rounded-full bg-teal-500 px-7 py-3.5 font-mono text-lg font-medium text-white"
						>
							I UNDERSTAND
						</button>
					</div>
				</div>
			{/if}
		</div>

	{:else if screen === 'did-you-know'}
		<!-- DID YOU KNOW INTERSTITIAL -->
		<div class="flex h-dvh flex-col bg-gradient-to-b from-blue-800 to-blue-900" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<!-- Compact header -->
			<div class="shrink-0 px-8 pt-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-white/80">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-white bg-teal-400"></span>
						<span class="font-mono text-sm font-medium text-white/80">YOU</span>
					</span>
				</div>
			</div>

			<!-- Scrollable content -->
			<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-8">
				<span class="font-mono text-sm font-medium text-white/80">DID YOU KNOW?</span>
				<p class="mt-4 font-sans text-4xl font-bold text-white">
					4 in 5 teenagers in Utah are chatting with AI friends online.
				</p>

				<!-- Body text -->
				<p class="mt-8 font-sans text-lg font-medium leading-9 text-white">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis finibus purus mollis, ultrices lorem quis, facilisis mauris. Nulla tortor magna, consequat sed pharetra quis, blandit elementum velit. Curabitur finibus et felis nec vehicula. Vivamus facilisis nunc sed dui ultrices, quis vulputate tellus egestas.
				</p>
			</div>

			<!-- Sticky bottom actions -->
			<div class="flex shrink-0 flex-col gap-2.5 border-t border-blue-700 bg-blue-900 px-7 py-8">
				<button
					disabled={countdown > 0}
					onclick={resumeVoting}
					class="flex w-full items-center justify-center rounded-full px-7 py-3.5 font-mono text-lg font-medium text-white/70 {countdown > 0 ? 'bg-white/20' : 'bg-teal-500 text-white'}"
				>
					{#if countdown > 0}
						CONTINUE IN {countdown}...
					{:else}
						CONTINUE
					{/if}
				</button>
			</div>
		</div>

	{:else if screen === 'pop-quiz'}
		<!-- POP QUIZ INTERSTITIAL -->
		<div class="flex h-dvh flex-col bg-gradient-to-b from-blue-800 to-blue-900" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<!-- Compact header -->
			<div class="shrink-0 px-8 pt-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-white/80">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-white bg-teal-400"></span>
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
									? 'bg-teal-500 text-white shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
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
			<div class="flex shrink-0 items-center gap-3.5 border-t border-blue-700 bg-blue-900 px-7 py-8">
				<button
					onclick={resumeVoting}
					class="flex h-14 flex-1 items-center justify-center rounded-full bg-teal-500 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					CONTINUE
				</button>
				<button
					onclick={resumeVoting}
					class="flex h-14 flex-1 items-center justify-center rounded-full bg-black/30 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					SKIP
				</button>
			</div>
		</div>

	{:else if screen === 'about-you'}
		<!-- ABOUT YOU demographic questions -->
		<div class="flex h-dvh flex-col bg-gradient-to-b from-blue-800 to-blue-900" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<!-- Compact header -->
			<div class="shrink-0 px-8 pt-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-white/80">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-white bg-teal-400"></span>
						<span class="font-mono text-sm font-medium text-white/80">YOU</span>
					</span>
				</div>
			</div>

			<!-- Scrollable content -->
			<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-8">
				<span class="font-mono text-sm font-medium text-white/80">ABOUT YOU</span>
				<p class="mt-4 font-sans text-4xl font-bold leading-10 text-white">
					{currentAbout.question}
				</p>
				<p class="mt-3 font-sans text-sm font-medium text-white/80">
					{currentAbout.description}
				</p>

				<!-- Options -->
				<div class="mt-8 flex flex-col gap-2">
					{#each currentAbout.options as option, i}
						<button
							onclick={() => toggleAboutSelection(i)}
							class="relative flex h-16 w-full items-center rounded-[20px] px-6 text-left font-sans text-2xl font-bold leading-7 transition-colors {aboutSelections.has(i)
								? 'bg-white text-blue-800 shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
								: 'bg-blue-900 text-white'}"
						>
							{option}
							{#if aboutSelections.has(i)}
								<span class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-900">
									<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Bottom actions -->
			<div class="flex shrink-0 items-center gap-3.5 border-t border-blue-700 bg-blue-900 px-7 py-8">
				<button
					onclick={() => {
						if (aboutIndex < aboutYouQuestions.length - 1) {
							aboutIndex++;
							aboutSelections = new Set();
						} else {
							resumeVoting();
						}
					}}
					class="flex h-14 flex-1 items-center justify-center rounded-full bg-teal-500 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					CONTINUE
				</button>
				<button
					onclick={() => {
						if (aboutIndex < aboutYouQuestions.length - 1) {
							aboutIndex++;
							aboutSelections = new Set();
						} else {
							resumeVoting();
						}
					}}
					class="flex h-14 flex-1 items-center justify-center rounded-full bg-black/30 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					SKIP
				</button>
			</div>
		</div>

	{:else if screen === 'nice-job'}
		<!-- NICE JOB celebration -->
		<div class="flex h-dvh flex-col bg-gradient-to-b from-blue-800 to-blue-900" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
			<!-- Compact header bar -->
			<div class="shrink-0 px-8 pt-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-white/80">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-white bg-teal-400"></span>
						<span class="font-mono text-sm font-medium text-white/80">YOU</span>
					</span>
				</div>
			</div>

			<!-- Centered content -->
			<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
				<div class="h-32 w-32 rounded-full bg-teal-400"></div>
				<p class="mt-[-90px] text-9xl font-bold drop-shadow-lg">🎉</p>
				<p class="mt-8 text-center font-sans text-4xl font-bold leading-10 text-white">
					Thank you for participating! Here's what's next...
				</p>
			</div>

			<!-- Bottom CTAs -->
			<div class="flex shrink-0 items-center gap-3.5 border-t border-blue-700 bg-blue-900 px-7 py-8">
				<button
					onclick={continueVoting}
					class="flex h-14 flex-1 items-center justify-center rounded-full bg-teal-500 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					KEEP VOTING
				</button>
				<button
					onclick={handleEnd}
					class="flex h-14 flex-1 items-center justify-center rounded-full bg-black/30 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					I'M DONE
				</button>
			</div>
		</div>

	{:else if screen === 'on-a-roll'}
		<!-- YOU'RE ON A ROLL (inline encouragement during voting) -->
		<div class="flex h-dvh flex-col bg-background" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
			<AppHeader
				countyName={county.name}
				question={deliberation.question}
				variant="on-primary"
				rounded
				shareInput
				onShareClick={() => (screen = 'compose')}
				class="shrink-0"
			/>

			<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
				<div class="h-52 w-52 rounded-full bg-primary"></div>
				<p class="mt-8 text-center font-sans text-3xl font-bold leading-9 text-primary">
					YOU'RE ON A ROLL!
				</p>
			</div>

			<div class="shrink-0">
				<VoteBar
					onAgree={() => handleVote('agree')}
					onDisagree={() => handleVote('disagree')}
					onSkip={() => handleVote('skip')}
					onEnd={handleEnd}
					current={totalVotes}
					total={totalStatements}
				/>
			</div>
		</div>

	{:else if screen === 'thank-you'}
		<!-- THANK YOU / WHAT'S NEXT completion -->
		<div class="flex h-dvh flex-col bg-gradient-to-b from-blue-800 to-blue-900" in:fly={{ y: 40, duration: 400, easing: cubicOut }}>
			<!-- Compact header bar -->
			<div class="shrink-0 px-8 pt-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-white/80">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-white bg-teal-400"></span>
						<span class="font-mono text-sm font-medium text-white/80">YOU</span>
					</span>
				</div>
			</div>

			<!-- Scrollable content -->
			<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-8">
				<!-- Emoji + circle -->
				<div class="flex flex-col items-center">
					<div class="relative">
						<div class="h-32 w-32 rounded-full bg-teal-400"></div>
						<span class="absolute inset-0 flex items-center justify-center text-9xl font-bold drop-shadow-[0px_4px_24px_rgba(0,0,0,0.25)]">🎉</span>
					</div>
				</div>

				<p class="mt-8 font-sans text-4xl font-bold leading-10 text-white">
					Thank you for participating! Here's what's next...
				</p>

				<!-- Report Back swipeable carousel -->
				<div
					class="mt-8 border-t border-b border-white/20 py-6 overflow-hidden"
					ontouchstart={handleReportTouchStart}
					ontouchmove={handleReportTouchMove}
					ontouchend={handleReportTouchEnd}
					role="region"
					aria-label="Report back carousel"
				>
					{#key reportSlideIndex}
						<div in:fly={{ x: reportTouchDelta <= 0 ? 60 : -60, duration: 250, easing: cubicOut }}>
							<h3 class="font-sans text-2xl font-bold leading-9 text-white">{reportSlides[reportSlideIndex].title}</h3>
							<p class="mt-3 font-sans text-lg font-medium leading-7 text-white/80">
								{reportSlides[reportSlideIndex].body}
							</p>
						</div>
					{/key}
					<!-- Pagination dots -->
					<div class="mt-6 flex items-center justify-center gap-[23px]">
						{#each reportSlides as _, i}
							<button
								onclick={() => (reportSlideIndex = i)}
								class="h-2 w-2 rounded-full transition-colors {i === reportSlideIndex ? 'bg-white' : 'bg-zinc-300/50'}"
								aria-label="Slide {i + 1}"
							></button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Bottom CTAs -->
			<div class="flex shrink-0 items-center gap-3.5 border-t border-blue-700 bg-blue-900 px-7 py-8">
				<button
					onclick={continueVoting}
					class="flex h-14 flex-1 items-center justify-center rounded-full bg-teal-500 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					CONTINUE
				</button>
				<a
					href="/demo"
					class="flex h-14 flex-1 items-center justify-center rounded-full bg-black/30 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					GO HOME
				</a>
			</div>
		</div>
	{/if}
</AppShell>
