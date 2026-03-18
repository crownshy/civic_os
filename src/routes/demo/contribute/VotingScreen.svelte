<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Header, VoteBar } from '$lib/components/ui';

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

	let previousText = statementText;
	let waitingForNext = $state(false);
	let voteCooldown = $state(false);


	$effect(() => {
		if (statementText !== previousText && !loading) {
			previousText = statementText;
			waitingForNext = false;
		}
	});

	// Reset skeleton if loading finishes without a new statement (e.g. vote failed)
	$effect(() => {
		if (waitingForNext && !loading && statementText === previousText) {
			waitingForNext = false;
		}
	});

	const disabled = $derived(voteCooldown || waitingForNext);

	function doVote(type: 'agree' | 'disagree' | 'pass') {
		if (voteCooldown) return;
		waitingForNext = true;
		voteCooldown = true;
		onVote(type);
		setTimeout(() => { voteCooldown = false; }, 1000);
	}
</script>

<div class="flex h-full flex-col bg-muted">
	<Header
		{countyName}
		{question}
		{onCompose}
		about
		rounded
		marquee={false}
	/>

	<!-- Statement content (white, centered) -->
	<div class="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8">
		{#if waitingForNext}
			<!-- Loading skeleton between statements -->
			<div in:fade={{ duration: 200 }} class="w-full animate-pulse text-left">
				<div class="flex items-center gap-2">
					<span class="h-5 w-5 rounded-full bg-card-foreground/20"></span>
					<span class="h-4 w-32 rounded bg-card-foreground/20"></span>
				</div>
				<div class="mt-6 space-y-3">
					<div class="h-8 w-full rounded bg-card-foreground/10"></div>
					<div class="h-8 w-4/5 rounded bg-card-foreground/10"></div>
					<div class="h-8 w-3/5 rounded bg-card-foreground/10"></div>
				</div>
			</div>
		{:else}
			<div
				class="w-full text-left max-h-[50vh] overflow-y-auto"
				in:fly={{ y: 20, duration: 500, easing: cubicOut }}
			>
				<!-- Attribution -->
				<div class="flex items-center gap-2">
					<span class="h-5 w-5 rounded-full bg-muted-foreground"></span>
					<span class="font-mono text-sm font-medium text-muted-foreground"> SOMEONE SAYS... </span>
				</div>

				<!-- Quote -->
				<p
					class="mt-4 font-sans text-3xl font-semibold leading-10 text-muted-foreground"
				>
					&ldquo;{statementText}&rdquo;
				</p>
			</div>
		{/if}
	</div>

	<VoteBar
		{remaining}
		{total}
		{disabled}
		onAgree={() => doVote('agree')}
		onDisagree={() => doVote('disagree')}
		onSkip={() => doVote('pass')}
		{onEnd}
	/>
</div>
