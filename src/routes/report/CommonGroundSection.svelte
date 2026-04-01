<script lang="ts">
	import type { CommentReportData } from '$lib/types/report';
	import SectionLabel from './SectionLabel.svelte';

	interface Props {
		participantCount: number;
		statements: CommentReportData[];
	}

	let { participantCount, statements }: Props = $props();

	let currentIndex = $state(0);
	let containerEl = $state<HTMLDivElement>();

	function scrollToCard(index: number) {
		if (!containerEl) return;
		const cards = containerEl.querySelectorAll('[data-card]');
		cards[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		currentIndex = index;
	}

	function handleScroll(e: Event) {
		const el = e.target as HTMLDivElement;
		const scrollLeft = el.scrollLeft;
		const cardWidth = el.querySelector('[data-card]')?.clientWidth ?? 300;
		currentIndex = Math.round(scrollLeft / (cardWidth + 16));
	}

	function getAgreementPercent(s: CommentReportData): number {
		const total = s.overall_votes.agrees + s.overall_votes.disagrees + s.overall_votes.passes;
		if (total === 0) return 0;
		return Math.round((s.overall_votes.agrees / total) * 100);
	}

	const consensusStatements = $derived(
		statements
			.filter((s) => s.group_informed_consensus !== null && s.group_informed_consensus >= 0.7)
			.sort((a, b) => (b.group_informed_consensus ?? 0) - (a.group_informed_consensus ?? 0))
			.slice(0, 6)
	);
</script>

<section class="relative overflow-hidden bg-background px-0 py-8">
	<div class="px-6">
		<SectionLabel>COMMON GROUND</SectionLabel>
	</div>

	<div class="mt-3 px-8">
		<h2 class="font-sans text-3xl font-bold leading-8 text-foreground">
			After engaging
			<span class="text-primary">{participantCount.toLocaleString()} people</span>
			all over Utah, we found a lot of
			<span class="text-primary">common ground.</span>
		</h2>
	</div>

	<p class="mt-5 px-8 font-sans text-base font-medium text-muted-foreground">
		These were statements that people tended to agree about regardless of their differences on other
		things.
	</p>

	<!-- Carousel -->
	<div class="relative mt-10">
		<!-- Horizontal scroll container -->
		<div
			bind:this={containerEl}
			onscroll={handleScroll}
			class="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide"
			style="scroll-padding: 24px;"
		>
			{#each consensusStatements as statement, i (statement.tid)}
				<div
					data-card
					class="relative flex w-[85%] shrink-0 snap-center flex-col items-center"
				>
					<!-- Per-card avatar -->
					<div
						class="z-10 h-12 w-12 rounded-full bg-linear-to-b from-background to-orange-200 outline-[0.8px] outline-stone-500/20"
					></div>
					<!-- Card body (overlaps avatar) -->
					<div
						class="-mt-5 flex min-h-48 w-full flex-col justify-between rounded-[30px] bg-linear-to-b from-white/90 to-white/0 px-7 pt-10 pb-7 outline-1 outline-stone-500"
					>
						<p class="font-sans text-xl font-semibold leading-6 text-foreground">
							"{statement.text}"
						</p>
						<div class="mt-4 flex justify-center">
							<span
								class="inline-flex items-center rounded-[10px] bg-primary px-2 py-0.5 font-mono text-sm font-medium leading-5 text-orange-100"
							>
								{getAgreementPercent(statement)}% AGREEMENT
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Dots -->
		<div class="mt-4 flex items-center justify-center gap-2">
			{#each consensusStatements as _, i}
				<button
					onclick={() => scrollToCard(i)}
					class="h-2 w-2 rounded-full transition-colors {currentIndex === i
						? 'bg-foreground'
						: 'bg-foreground/30'}"
					aria-label="Card {i + 1}"
				></button>
			{/each}
		</div>
	</div>
</section>

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
