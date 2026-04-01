<script lang="ts">
	import type { CommentReportData } from '$lib/types/report';
	import SectionLabel from './SectionLabel.svelte';
	import SwipeCarousel from '$lib/components/ui/SwipeCarousel.svelte';

	interface Props {
		participantCount: number;
		statements: CommentReportData[];
	}

	let { participantCount, statements }: Props = $props();

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
	<div class="mt-5 px-6 select-none" >
		<SwipeCarousel count={consensusStatements.length} hideDots={true} autoScrollMs={4000}>
			{#snippet children(i)}
				{@const statement = consensusStatements[i]}
				<div class="relative flex flex-col items-center">
					<!-- Avatar -->
					<div
						class="z-10 h-12 w-12 rounded-full bg-linear-to-b from-background to-orange-200 outline-[0.8px] outline-stone-500/20"
					></div>
					<!-- Card body (overlaps avatar) -->
					<div class="-mt-5 rounded-3xl p-px bg-linear-to-b from-stone-300 to-transparent">
						<div
							class="flex min-h-48 w-full flex-col justify-between rounded-[calc(1.5rem-1px)] bg-linear-to-b from-white to-background px-7 pt-10 pb-7"
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
				</div>
			{/snippet}
		</SwipeCarousel>
	</div>
</section>
