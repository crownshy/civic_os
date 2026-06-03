<script lang="ts">
	import type { CommentReportData } from '$lib/types/report';
	import Badge from '$lib/components/ui/Badge.svelte';
	import SwipeCarousel from '$lib/components/ui/SwipeCarousel.svelte';
	import GradientCard from '$lib/components/ui/GradientCard.svelte';

	interface Props {
		participantCount: number;
		statements: CommentReportData[];
		regionName?: string;
	}

	let { participantCount, statements, regionName = 'Utah' }: Props = $props();

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

<section class="-px-10 relative overflow-hidden bg-background py-8">
	<div class="px-6">
		<Badge variant="soft" size="lg">COMMON GROUND</Badge>
	</div>

	<div class="mt-3 px-8">
		<h2 class="font-display text-3xl leading-8 font-medium tracking-display text-foreground">
			After engaging
			<span class="text-primary">{participantCount.toLocaleString()} people</span>
			all over {regionName}, we found a lot of
			<span class="text-primary">common ground.</span>
		</h2>
	</div>

	<p class="mt-5 px-8 font-sans text-base font-medium text-muted-foreground">
		These were statements that people tended to agree about regardless of their differences on other
		things.
	</p>

	<!-- Carousel -->
	<div class="mt-5 px-6 select-none">
		<SwipeCarousel count={consensusStatements.length} hideDots={true} autoScrollMs={4000}>
			{#snippet children(i)}
				{@const statement = consensusStatements[i]}
				<div class="relative flex flex-col items-center">
					<!-- Avatar -->
					<div
						class="z-10 h-12 w-12 rounded-full bg-linear-to-b from-background to-accent outline-[0.8px] outline-border"
					></div>
					<!-- Card body (overlaps avatar) -->
					<GradientCard
						borderGradient="bg-linear-to-b from-border to-transparent"
						bg="bg-linear-to-b from-card to-background"
						class="-mt-5"
					>
						<div class="flex min-h-48 w-full flex-col justify-between px-7 pt-10 pb-7">
							<p class="font-sans text-xl leading-6 font-semibold text-foreground">
								"{statement.text}"
							</p>
							<div class="mt-4 flex justify-center">
								<Badge variant="primary" size="md" class="rounded-[10px] px-2 py-0.5 text-sm">
									{getAgreementPercent(statement)}% AGREEMENT
								</Badge>
							</div>
						</div>
					</GradientCard>
				</div>
			{/snippet}
		</SwipeCarousel>
	</div>
</section>
