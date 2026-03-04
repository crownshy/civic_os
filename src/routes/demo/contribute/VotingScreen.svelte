<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppHeader } from '$lib/components/layout';
	import { VoteBar } from '$lib/components/ui';

	interface Props {
		countyName: string;
		question: string;
		statementText: string;
		remaining: number;
		total: number;
		loading?: boolean;
		onVote: (type: 'agree' | 'disagree' | 'pass') => void;
		onEnd: () => void;
		onCompose: () => void;
	}

	let {
		countyName,
		question,
		statementText,
		remaining,
		total,
		loading = false,
		onVote,
		onEnd,
		onCompose
	}: Props = $props();

	let lastDisplayedText = $state(statementText);
	let waitingForNext = $state(false);

	$effect(() => {
		if (statementText !== lastDisplayedText && !loading) {
			lastDisplayedText = statementText;
			waitingForNext = false;
		}
	});

	const statementClasses = $derived.by(() => {
		const len = statementText.length;
		if (len < 60) return 'font-sans text-5xl font-bold leading-[1.1]';
		if (len < 140) return 'font-sans text-3xl font-semibold leading-10';
		return 'font-sans text-2xl font-medium leading-8';
	});

	// Swipe state
	let swipeStartX = $state(0);
	let swipeStartY = $state(0);
	let swipeDeltaX = $state(0);
	let swiping = $state(false);
	let swipeDirection = $state<'none' | 'agree' | 'disagree'>('none');
	let swipeDismissed = $state(false);

	const SWIPE_THRESHOLD = 80;

	function handleSwipeStart(e: TouchEvent) {
		if (swipeDismissed || waitingForNext) return;
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
		if (Math.abs(dx) > Math.abs(dy) * 1.2) {
			swipeDeltaX = dx;
			swipeDirection = dx > SWIPE_THRESHOLD ? 'agree' : dx < -SWIPE_THRESHOLD ? 'disagree' : 'none';
		}
	}

	function doVote(type: 'agree' | 'disagree' | 'skip') {
		waitingForNext = true;
		onVote(type);
		swipeDeltaX = 0;
		swipeDirection = 'none';
		swipeDismissed = false;
	}

	function handleSwipeEnd() {
		if (!swiping || swipeDismissed) return;
		swiping = false;
		if (swipeDirection === 'agree') {
			swipeDismissed = true;
			setTimeout(() => doVote('agree'), 200);
		} else if (swipeDirection === 'disagree') {
			swipeDismissed = true;
			setTimeout(() => doVote('disagree'), 200);
		} else {
			swipeDeltaX = 0;
			swipeDirection = 'none';
		}
	}
</script>

<div class="flex h-dvh flex-col bg-card" in:fly={{ x: -40, duration: 350, easing: cubicOut }}>
	<AppHeader
		{countyName}
		{question}
		variant="on-primary"
		rounded
		shareInput
		onShareClick={onCompose}
		class="shrink-0"
	/>

	<!-- Swipeable statement content -->
	<div
		class="relative flex flex-1 flex-col overflow-x-hidden px-8 pt-6"
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
					class="rounded-full px-4 py-2 font-mono text-sm font-medium transition-opacity {swipeDirection === 'agree' ? 'bg-secondary text-secondary-foreground opacity-100' : 'opacity-0'}"
				>
					AGREE
				</span>
			</div>
		{/if}

		{#if waitingForNext}
			<!-- Loading skeleton between statements -->
			<div in:fade={{ duration: 200 }} class="animate-pulse">
				<div class="flex items-center gap-2">
					<span class="h-5 w-5 rounded-full bg-primary/20"></span>
					<span class="h-4 w-32 rounded bg-primary/20"></span>
				</div>
				<div class="mt-6 space-y-3">
					<div class="h-8 w-full rounded bg-primary/10"></div>
					<div class="h-8 w-4/5 rounded bg-primary/10"></div>
					<div class="h-8 w-3/5 rounded bg-primary/10"></div>
				</div>
			</div>
		{:else}
			<div
				class="transition-transform {swiping ? 'duration-0' : 'duration-300'}"
				style="transform: translateX({swipeDismissed ? (swipeDirection === 'agree' ? 400 : -400) : swipeDeltaX}px) rotate({swipeDismissed ? (swipeDirection === 'agree' ? 8 : -8) : swipeDeltaX * 0.04}deg); opacity: {swipeDismissed ? 0 : 1}"
				in:fly={{ y: 20, duration: 300, easing: cubicOut }}
			>
				<!-- Attribution -->
				<div class="flex items-center gap-2">
					<span
						class="h-5 w-5 rounded-full bg-primary"
					></span>
					<span class="font-mono text-sm font-medium text-primary">
						SOMEONE SAYS...
					</span>
				</div>

				<!-- Quote with adaptive font -->
				<p class="mt-4 pb-60 overflow-y-auto {statementClasses} text-primary">
					{statementText}
				</p>
			</div>
		{/if}
	</div>

	<!-- Sticky bottom VoteBar -->
	<div class="absolute bottom-0 left-0 right-0 shrink-0 w-full">
		<VoteBar
			onAgree={waitingForNext ? undefined : () => doVote('agree')}
			onDisagree={waitingForNext ? undefined : () => doVote('disagree')}
			onSkip={waitingForNext ? undefined : () => doVote('pass')}
			{onEnd}
			current={total - remaining}
			{total}
		/>
	</div>
</div>
