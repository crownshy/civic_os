<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import { county, aboutYouQuestions } from '$lib/data/mock';

	let aboutIndex = $state(0);
	let aboutSelections = $state<Set<number>>(new Set());
	const currentAbout = $derived(aboutYouQuestions[aboutIndex % aboutYouQuestions.length]);

	function toggleSelection(idx: number) {
		const next = new Set(aboutSelections);
		if (currentAbout.multiSelect) {
			if (next.has(idx)) next.delete(idx);
			else next.add(idx);
		} else {
			next.clear();
			next.add(idx);
		}
		aboutSelections = next;
	}

	function nextQuestion() {
		if (aboutIndex < aboutYouQuestions.length - 1) {
			aboutIndex++;
			aboutSelections = new Set();
		} else {
			aboutIndex = 0;
			aboutSelections = new Set();
		}
	}
</script>

<AppShell>
	<div class="flex h-dvh flex-col bg-gradient-to-b from-blue-800 to-blue-900">
		<!-- Compact header -->
		<div class="shrink-0 px-8 pt-6">
			<div class="flex items-center justify-between">
				<span class="font-mono text-sm font-medium text-white/80">{county.name}</span>
				<span class="flex items-center gap-2">
					<span class="h-3 w-3 rounded-full border border-white bg-secondary"></span>
					<span class="font-mono text-sm font-medium text-white/80">YOU</span>
				</span>
			</div>
		</div>

		<!-- Scrollable content -->
		<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-8">
			<span class="font-mono text-sm font-medium text-white/80">ABOUT YOU</span>
			<p class="mt-4 font-sans text-4xl font-bold leading-10 text-white">
				{currentAbout.question}
			</p>
			<p class="mt-3 font-sans text-sm font-medium text-white/80">
				{currentAbout.description}
			</p>

			<!-- Options -->
			<div class="mt-8 flex flex-col gap-2">
				{#each currentAbout.options as option, i}
					<button
						onclick={() => toggleSelection(i)}
						class="relative flex h-16 w-full items-center rounded-[20px] px-6 text-left font-sans text-2xl font-bold leading-7 transition-colors {aboutSelections.has(i)
							? 'bg-white text-blue-800 shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
							: 'bg-blue-900 text-white'}"
					>
						{option}
						{#if aboutSelections.has(i)}
							<span class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-900">
								<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Bottom actions -->
		<div class="flex shrink-0 items-center gap-3.5 border-t border-primary bg-blue-900 px-7 py-8">
			<button
				onclick={nextQuestion}
				class="flex h-14 flex-1 items-center justify-center rounded-full bg-secondary font-mono text-lg font-medium text-secondary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
			>
				CONTINUE
			</button>
			<a
				href="/demo"
				class="flex h-14 flex-1 items-center justify-center rounded-full bg-black/30 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
			>
				SKIP
			</a>
		</div>
	</div>
</AppShell>
