<script lang="ts">
	import SectionLabel from './SectionLabel.svelte';

	const tabs = ['Age', 'Location', 'Gender', 'Race & Ethnicity', 'Political'] as const;
	let activeTab = $state(1);

	const ageData = [
		{ label: '18-24', color: 'bg-lime-400', count: 312 },
		{ label: '25-39', color: 'bg-indigo-400', count: 486 },
		{ label: '40-54', color: 'bg-amber-400', count: 398 },
		{ label: '55-64', color: 'bg-red-400', count: 224 },
		{ label: '65+', color: 'bg-pink-950', count: 156 },
		{ label: 'Not Provided', color: 'bg-neutral-500', count: 569 }
	];

	function handleTabClick(index: number) {
		activeTab = index;
	}
</script>

<section class="relative overflow-hidden bg-background py-6">
	<div class="px-6">
		<SectionLabel>DEMOGRAPHICS</SectionLabel>
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
	<div
		class="mx-6 mt-10 overflow-hidden rounded-t-[30px] bg-linear-to-b from-white/90 to-white/0 outline outline-1 outline-stone-500"
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

		<!-- Content area -->
		<div class="relative min-h-[280px] px-6 py-8">
			{#if activeTab === 0}
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
			{:else if activeTab === 1}
				<!-- Location (map placeholder) -->
				<div class="flex flex-col items-center">
					<div class="flex h-[200px] w-full items-center justify-center rounded-lg bg-stone-100">
						<p class="font-mono text-xs text-stone-400">MAP PLACEHOLDER</p>
					</div>

					<div class="mt-4 flex w-full flex-col items-center gap-1">
						<span class="font-mono text-[10px] font-medium text-stone-500 opacity-50"
							>PARTICIPATION</span
						>
						<div class="flex w-full items-center gap-2">
							<span class="font-mono text-[10px] text-stone-500">0</span>
							<div
								class="h-3.5 flex-1 rounded-sm bg-linear-to-r from-teal-100 to-teal-600"
							></div>
							<span class="font-mono text-[10px] text-stone-500">X</span>
						</div>
					</div>
				</div>
			{:else if activeTab === 2}
				<!-- Gender placeholder -->
				<div class="flex flex-col items-center">
					<div class="text-center font-mono text-2xl font-medium text-foreground">1.1K</div>
					<div class="font-mono text-[10px] font-medium text-foreground">PARTICIPANTS</div>
					<p class="mt-8 font-sans text-sm text-muted-foreground">
						Gender demographic data placeholder
					</p>
				</div>
			{:else if activeTab === 3}
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
