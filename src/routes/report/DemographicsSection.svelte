<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import GradientCard from '$lib/components/ui/GradientCard.svelte';
	import SwipeCarousel from '$lib/components/ui/SwipeCarousel.svelte';

	const tabs = ['Age', 'Location', 'Gender', 'Race & Ethnicity', 'Political'] as const;
	let activeTab = $state(1);

	const ageData = [
		{ label: '18-24', color: 'bg-chart-1', count: 312 },
		{ label: '25-39', color: 'bg-chart-2', count: 486 },
		{ label: '40-54', color: 'bg-chart-3', count: 398 },
		{ label: '55-64', color: 'bg-chart-4', count: 224 },
		{ label: '65+', color: 'bg-chart-5', count: 156 },
		{ label: 'Not Provided', color: 'bg-chart-6', count: 569 }
	];

	function handleTabClick(index: number) {
		activeTab = index;
	}
</script>

<section class="relative overflow-hidden bg-background py-6">
	<div class="px-6">
		<Badge variant="soft" size="lg">DEMOGRAPHICS</Badge>
	</div>

	<div class="mt-8 px-8">
		<h2 class="font-sans text-3xl font-bold leading-8 text-foreground">
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
			{#each tabs as tab, i}
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
						<div class="flex flex-col items-center">
							<div class="text-center font-mono text-2xl font-medium text-foreground">1.1K</div>
							<div class="font-mono text-[10px] font-medium text-foreground">PARTICIPANTS</div>

							<div class="mt-8 grid w-full grid-cols-2 gap-3">
								{#each ageData as item}
									<div class="flex items-center gap-3.5">
										<div class="h-3 w-3 shrink-0 rounded-full {item.color}"></div>
										<span class="font-sans text-sm font-medium text-foreground">{item.label}</span>
									</div>
								{/each}
							</div>
						</div>
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
						<!-- Gender placeholder -->
						<div class="flex flex-col items-center">
							<div class="text-center font-mono text-2xl font-medium text-foreground">1.1K</div>
							<div class="font-mono text-[10px] font-medium text-foreground">PARTICIPANTS</div>
							<p class="mt-8 font-sans text-sm text-muted-foreground">
								Gender demographic data placeholder
							</p>
						</div>
					{:else if i === 3}
						<!-- Race & Ethnicity placeholder -->
						<div class="flex flex-col items-center">
							<div class="text-center font-mono text-2xl font-medium text-foreground">1.1K</div>
							<div class="font-mono text-[10px] font-medium text-foreground">PARTICIPANTS</div>
							<p class="mt-8 font-sans text-sm text-muted-foreground">
								Race & ethnicity demographic data placeholder
							</p>
						</div>
					{:else}
						<!-- Political placeholder -->
						<div class="flex flex-col items-center">
							<div class="text-center font-mono text-2xl font-medium text-foreground">1.1K</div>
							<div class="font-mono text-[10px] font-medium text-foreground">PARTICIPANTS</div>
							<p class="mt-8 font-sans text-sm text-muted-foreground">
								Political affiliation demographic data placeholder
							</p>
						</div>
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
