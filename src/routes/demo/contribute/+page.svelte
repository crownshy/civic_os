<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppShell, AppHeader } from '$lib/components/layout';
	import { VoteBar, PillButton, MonoLabel, QuoteText } from '$lib/components/ui';
	import ComposeOverlay from '$lib/components/ui/ComposeOverlay.svelte';
	import { county, deliberation, statements, learningCards } from '$lib/data/mock';

	type Screen = 'voting' | 'compose' | 'did-you-know' | 'nice-job' | 'on-a-roll' | 'whats-next';

	let screen = $state<Screen>('voting');
	let currentIndex = $state(0);
	let votesInRound = $state(0);
	let totalVotes = $state(0);
	const totalStatements = statements.length;
	const milestoneInterval = 5;

	const currentStatement = $derived(statements[currentIndex % totalStatements]);

	// Adaptive font size based on statement text length
	const statementSize = $derived.by(() => {
		const len = currentStatement.text.length;
		if (len < 60) return 'text-5xl';
		if (len < 140) return 'text-4xl';
		return 'text-2xl';
	});

	// Countdown timer for interstitials
	let countdown = $state(5);
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	function startCountdown(cb: () => void) {
		countdown = 5;
		if (countdownInterval) clearInterval(countdownInterval);
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				if (countdownInterval) clearInterval(countdownInterval);
				countdownInterval = null;
			}
		}, 1000);
	}

	function handleVote(type: 'agree' | 'disagree' | 'skip') {
		totalVotes++;
		votesInRound++;
		currentIndex++;

		// Check total FIRST — if we've done all statements, show nice-job
		if (currentIndex >= totalStatements) {
			screen = 'nice-job';
			return;
		}

		// Every milestone votes, show a learning interstitial
		if (votesInRound === milestoneInterval) {
			votesInRound = 0;
			screen = 'did-you-know';
			startCountdown(() => {});
			return;
		}
	}

	function handleEnd() {
		screen = 'whats-next';
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
		// In a real app, this would submit the statement
		screen = 'voting';
	}
</script>

<AppShell>
	{#if screen === 'voting'}
		<!-- Voting screen -->
		<div class="flex h-dvh flex-col bg-background" in:fly={{ x: -40, duration: 350, easing: cubicOut }}>
			<!-- Header with rounded bottom + share input -->
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

			<!-- Scrollable statement content -->
			<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-6">
				{#key currentIndex}
					<div in:fly={{ y: 20, duration: 300, easing: cubicOut }}>
						<!-- Attribution -->
						<div class="flex items-center gap-2">
							<span
								class="h-5 w-5 rounded-full"
								style="background-color: {currentStatement.authorColor ?? '#2952C0'}"
							></span>
							<span
								class="font-mono text-sm font-medium"
								style="color: {currentStatement.authorColor ?? '#2952C0'}"
							>
								{currentStatement.authorAlias} SAYS...
							</span>
						</div>

						<!-- Quote with adaptive font size -->
						<p class="mt-4 font-mono {statementSize} font-medium text-primary">
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
		<div in:fly={{ y: 100, duration: 400, easing: cubicOut }}>
		<ComposeOverlay
			question={deliberation.question}
			countyName={county.name}
			onSubmit={handleCompose}
			onBack={() => (screen = 'voting')}
		/>
		</div>

	{:else if screen === 'did-you-know'}
		<!-- DID YOU KNOW INTERSTITIAL -->
		<div class="flex h-dvh flex-col bg-primary" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
			<!-- Compact header -->
			<div class="shrink-0 border-b border-primary-foreground/40 px-8 py-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-primary-foreground">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-primary-foreground bg-teal-400"></span>
						<span class="font-mono text-sm font-medium text-primary-foreground">YOU</span>
					</span>
				</div>
				<p class="mt-4 font-mono text-lg font-medium text-primary-foreground">
					{deliberation.question}
				</p>
			</div>

			<!-- Scrollable content -->
			<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-6">
				<span class="font-mono text-lg font-medium text-primary-foreground/70">DID YOU KNOW?</span>
				<p class="mt-4 font-mono text-3xl font-medium text-primary-foreground">
					4 in 5 teenagers in Utah are chatting with AI friends online.
				</p>

				<!-- Image placeholder -->
				<div class="mt-6 h-64 rounded-[10px] bg-gradient-to-br from-cyan-200 to-primary"></div>

				<!-- Body text -->
				<p class="mt-6 font-mono text-base font-medium leading-6 text-primary-foreground">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis finibus purus mollis, ultrices lorem quis, facilisis mauris. Nulla tortor magna, consequat sed pharetra quis, blandit elementum velit.
				</p>
			</div>

			<!-- Sticky bottom actions -->
			<div class="flex shrink-0 flex-col gap-3 bg-primary/90 px-8 pb-8 pt-4 backdrop-blur-sm">
				<PillButton
					variant="ghost"
					fullWidth
					disabled={countdown > 0}
					onclick={resumeVoting}
				>
					{#if countdown > 0}
						CONTINUE IN {countdown}...
					{:else}
						CONTINUE
					{/if}
				</PillButton>
				<PillButton variant="filled-white" fullWidth>
					LEARN MORE
				</PillButton>
			</div>
		</div>

	{:else if screen === 'nice-job'}
		<!-- NICE JOB celebration -->
		<div class="flex h-dvh flex-col bg-primary" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
			<!-- Compact header bar -->
			<div class="shrink-0 border-b border-primary-foreground/40 px-8 py-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-primary-foreground">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-primary-foreground bg-teal-400"></span>
						<span class="font-mono text-sm font-medium text-primary-foreground">YOU</span>
					</span>
				</div>
			</div>

			<!-- Centered content -->
			<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
				<div class="h-80 w-80 rounded-full bg-white/20"></div>
				<p class="mt-[-180px] text-center font-mono text-5xl font-medium text-primary-foreground">
					NICE JOB!
				</p>
				<p class="mt-8 text-center font-mono text-3xl font-medium text-primary-foreground">
					Keep contributing to the conversation – your voice counts!
				</p>
			</div>

			<!-- Bottom CTAs -->
			<div class="flex shrink-0 flex-col gap-3 px-8 pb-8">
				<PillButton variant="filled-white" fullWidth onclick={continueVoting}>
					KEEP VOTING
				</PillButton>
				<PillButton variant="ghost" fullWidth onclick={handleEnd}>
					I'M DONE
				</PillButton>
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
				<p class="mt-8 text-center font-mono text-3xl font-medium leading-9 text-primary">
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

	{:else if screen === 'whats-next'}
		<!-- WHAT'S NEXT completion -->
		<div class="flex h-dvh flex-col bg-primary" in:fly={{ y: 40, duration: 400, easing: cubicOut }}>
			<!-- Compact header bar -->
			<div class="shrink-0 border-b border-primary-foreground/40 px-8 py-6">
				<div class="flex items-center justify-between">
					<span class="font-mono text-sm font-medium text-primary-foreground">{county.name}</span>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-full border border-primary-foreground bg-teal-400"></span>
						<span class="font-mono text-sm font-medium text-primary-foreground">YOU</span>
					</span>
				</div>
			</div>

			<!-- Scrollable content -->
			<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-8">
				<p class="font-mono text-5xl font-medium text-primary-foreground">WHAT'S NEXT?</p>

				<!-- Gradient image placeholder -->
				<div class="mt-6 h-48 rounded-[10px] bg-gradient-to-br from-cyan-200 to-primary"></div>

				<div class="mt-6 font-mono text-lg font-medium text-primary-foreground">
					<p>Thank you for participating! You're awesome.</p>
					<br />
					<p>
						In the next few weeks, we'll know more about how people all over Utah are thinking about
						this issue. We'll send you an email with the most interesting insights, including where
						YOU fit into the conversation.
					</p>
					<br />
					<p>
						In ____, we'll start to organize small-group conversations to develop ideas. If you'd
						like to take part in that, let us know:
					</p>
				</div>
			</div>

			<!-- Bottom CTAs -->
			<div class="flex shrink-0 flex-col gap-3 px-8 pb-8">
				<a href="/demo">
					<PillButton variant="filled-white" fullWidth>GO HOME</PillButton>
				</a>
				<PillButton variant="ghost" fullWidth onclick={continueVoting}>
					BACK TO VOTING
				</PillButton>
			</div>
		</div>
	{/if}
</AppShell>
