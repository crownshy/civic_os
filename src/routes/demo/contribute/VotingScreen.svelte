<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppHeader } from '$lib/components/layout';
	import { VoteBar } from '$lib/components/ui';
	import type { Statement } from '$lib/types/mock-data';

	interface Props {
		countyName: string;
		question: string;
		statement: Statement;
		totalVotes: number;
		totalStatements: number;
		currentIndex: number;
		onVote: (type: 'agree' | 'disagree' | 'skip') => void;
		onEnd: () => void;
		onCompose: () => void;
	}

	let {
		countyName,
		question,
		statement,
		totalVotes,
		totalStatements,
		currentIndex,
		onVote,
		onEnd,
		onCompose
	}: Props = $props();

	// Adaptive font sizing
	const statementClasses = $derived.by(() => {
		const len = statement.text.length;
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
				onVote('agree');
				swipeDeltaX = 0;
				swipeDirection = 'none';
				swipeDismissed = false;
			}, 200);
		} else if (swipeDirection === 'disagree') {
			swipeDismissed = true;
			setTimeout(() => {
				onVote('disagree');
				swipeDeltaX = 0;
				swipeDirection = 'none';
				swipeDismissed = false;
			}, 200);
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
						style="background-color: {statement.authorColor ?? '#2952C0'}"
					></span>
					<span class="font-mono text-sm font-medium text-primary">
						{statement.authorAlias} SAYS...
					</span>
				</div>

				<!-- Quote with adaptive font -->
				<p class="mt-4 pb-60 overflow-y-auto {statementClasses} text-primary">
					{statement.text}
				</p>
			</div>
		{/key}
	</div>

	<!-- Sticky bottom VoteBar -->
	<div class="absolute bottom-0 left-0 right-0 shrink-0 w-full">
		<VoteBar
			onAgree={() => onVote('agree')}
			onDisagree={() => onVote('disagree')}
			onSkip={() => onVote('skip')}
			{onEnd}
			current={totalVotes}
			total={totalStatements}
		/>
	</div>
</div>
