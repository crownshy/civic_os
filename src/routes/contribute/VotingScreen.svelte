<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { InfoBar, VoteBar } from '$lib/components/ui';
	import type { RegionConfig } from '$lib/config/regions';

	interface Props {
		countyName: string;
		statementText: string;
		remaining: number;
		total: number;
		loading?: boolean;
		onVote: (type: 'agree' | 'disagree' | 'pass') => void;
		onEnd: () => void;
		onCompose: () => void;
		region: RegionConfig
	}

	let {
		countyName,
		statementText,
		remaining,
		total,
		loading = false,
		onVote,
		onEnd,
		onCompose,
		region
	}: Props = $props();

	const progress = $derived(total > 0 ? ((total - remaining) / total) * 100 : 0);

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
	<InfoBar {countyName} {region} {onEnd} />

	<!-- Statement content (white, centered) -->
	<div class="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-10">
		<div class="absolute top-0 left-0 h-[3px] w-full bg-secondary/30">
			<div class="h-full bg-secondary transition-all duration-300" style="width: {progress}%"></div>
		</div>
		<div class="absolute top-[3px] left-0 w-full flex items-start justify-between px-4 py-2">
			<span class="font-mono text-sm font-medium uppercase text-muted-foreground/70 pr-4">{region.carouselHeader}</span>
			<span class="font-mono text-sm font-medium uppercase text-muted-foreground/70 shrink-0">{remaining} LEFT</span>
		</div>
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
				class="w-full text-left max-h-[60vh] mt-6 overflow-y-auto"
				in:fly={{ y: 20, duration: 500, easing: cubicOut }}
			>
				<!-- Attribution -->
				<div class="flex items-center gap-2">
					<span class="font-mono text-sm font-medium text-muted-foreground">SOMEONE SAYS... </span>
				</div>

				<!-- Quote -->
				<p
					class="mt-6 font-sans text-3xl font-semibold leading-[1.25] text-muted-foreground"
				>
					&ldquo;{statementText}&rdquo;
				</p>
			</div>
		{/if}
	</div>

	<VoteBar
		{disabled}
		onAgree={() => doVote('agree')}
		onDisagree={() => doVote('disagree')}
		onSkip={() => doVote('pass')}
		{onCompose}
	/>
</div>
