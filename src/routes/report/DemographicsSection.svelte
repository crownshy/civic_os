<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import GradientCard from '$lib/components/ui/GradientCard.svelte';
	import SwipeCarousel from '$lib/components/ui/SwipeCarousel.svelte';
	import DonutChart from '$lib/components/ui/DonutChart.svelte';

	interface DemographicCategory {
		category: string;
		count: number;
		value?: string | null;
	}

	interface DemographicReport {
		ageRanges: DemographicCategory[];
		ethnicity: DemographicCategory[];
		gender: DemographicCategory[];
		politicalParty: DemographicCategory[];
		totalParticipants: number;
		zipcodeCounts: Record<string, number>;
	}

	interface Props {
		demographics: DemographicReport | null;
		participantCount: number;
	}

	let { demographics, participantCount }: Props = $props();

	const chartColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6'];

	const tabs = ['Age', 'Location', 'Gender', 'Race & Ethnicity', 'Political'] as const;
	let activeTab = $state(1);


	function toCategoryItems(categories: DemographicCategory[]) {
		return categories.map((c, i) => ({
			label: c.value ? c.value : "Not Provided",
			color: c.value ? chartColors[i % chartColors.length] : 'bg-chart-undefined' ,
			count: c.count
		}));
	}

	const ageData = $derived(
		demographics?.ageRanges?.length ? toCategoryItems(demographics.ageRanges) : [] 
	);

	const genderData = $derived(
		demographics?.gender?.length ? toCategoryItems(demographics.gender) : []
	);

	const ethnicityData = $derived(
		demographics?.ethnicity?.length ? toCategoryItems(demographics.ethnicity) : []
	);

	const politicalData = $derived(
		demographics?.politicalParty?.length ? toCategoryItems(demographics.politicalParty) : []
	);

	console.log({ageData, ethnicityData, politicalData,genderData})


	const totalDisplay = $derived(
		demographics?.totalParticipants
			? demographics.totalParticipants >= 1000
				? `${(demographics.totalParticipants / 1000).toFixed(1)}K`
				: demographics.totalParticipants.toString()
			: participantCount >= 1000
				? `${(participantCount / 1000).toFixed(1)}K`
				: participantCount.toString()
	);

	function handleTabClick(index: number) {
		activeTab = index;
	}
</script>

<section class="relative overflow-hidden bg-background py-6">
	<div class="px-6">
		<Badge variant="soft" size="lg">DEMOGRAPHICS</Badge>
	</div>

	<div class="mt-8 px-8">
		<h2 class="font-display tracking-display text-3xl font-medium leading-8 text-foreground">
			This Open Poll engaged people of different backgrounds.
		</h2>
	</div>

	<p class="mt-5 px-8 font-sans text-base font-medium text-foreground">
		Participation generally reflected the state's population. Explore the demographics below.
	</p>

	<!-- Demographics card -->
	<GradientCard
		bg="bg-linear-to-b from-card to-background"
		borderGradient="bg-linear-to-b from-border to-transparent"
		class="mx-6 mt-10"
	>
		<!-- Tabs -->
		<div class="scrollbar-hide flex gap-8 overflow-x-auto px-6 pt-5">
			{#each tabs as tab, i (tab)}
				<button
					onclick={() => handleTabClick(i)}
					class="shrink-0 whitespace-nowrap font-sans text-2xl font-bold leading-7 transition-opacity {activeTab === i
						? 'text-foreground opacity-100'
						: 'text-foreground opacity-40'}"
				>
					{tab}
				</button>
			{/each}
		</div>

		<!-- Swipeable content -->
		<SwipeCarousel count={tabs.length} bind:index={activeTab} hideDots={true}>
			{#snippet children(i)}
				<div class="min-h-[280px] px-6 py-8">
					{#if i === 0}
						<!-- Age breakdown -->
						<DonutChart data={ageData} size={200} />
					{:else if i === 1}
						<!-- Location (map placeholder) -->
						<div class="flex flex-col items-center">
							<div class="flex h-[200px] w-full items-center justify-center rounded-lg bg-muted">
								<p class="font-mono text-xs text-muted-foreground">MAP PLACEHOLDER</p>
							</div>

							<div class="mt-4 flex w-full flex-col items-center gap-1">
								<span class="font-mono text-[10px] font-medium text-muted-foreground opacity-50"
									>PARTICIPATION</span
								>
								<div class="flex w-full items-center gap-2">
									<span class="font-mono text-[10px] text-muted-foreground">0</span>
									<div
										class="h-3.5 flex-1 rounded-sm bg-linear-to-r from-primary/20 to-primary"
									></div>
									<span class="font-mono text-[10px] text-muted-foreground">X</span>
								</div>
							</div>
						</div>
					{:else if i === 2}
						<!-- Gender -->
						{#if genderData.length}
							<DonutChart data={genderData} size={200} />
						{:else}
							<p class="mt-8 font-sans text-sm text-muted-foreground">No gender data available yet.</p>
						{/if}
					{:else if i === 3}
						<!-- Race & Ethnicity -->
						{#if ethnicityData.length}
							<DonutChart data={ethnicityData} size={200} />
						{:else}
							<p class="mt-8 font-sans text-sm text-muted-foreground">No ethnicity data available yet.</p>
						{/if}
					{:else}
						<!-- Political -->
						{#if politicalData.length}
							<DonutChart data={politicalData} size={200} />
						{:else}
							<p class="mt-8 font-sans text-sm text-muted-foreground">No political affiliation data available yet.</p>
						{/if}
					{/if}
				</div>
			{/snippet}
		</SwipeCarousel>
	</GradientCard>
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
