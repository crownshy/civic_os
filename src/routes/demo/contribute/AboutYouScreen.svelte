<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { BlueHeader, Button } from '$lib/components/ui';
	import type { AboutYouQuestion } from '$lib/types/mock-data';

	interface Props {
		countyName: string;
		questions: AboutYouQuestion[];
		onDone: () => void;
	}

	let { countyName, questions, onDone }: Props = $props();

	let aboutIndex = $state(0);
	let aboutSelections = $state<Set<number>>(new Set());
	const currentAbout = $derived(questions[aboutIndex % questions.length]);

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

	function advance() {
		if (aboutIndex < questions.length - 1) {
			aboutIndex++;
			aboutSelections = new Set();
		} else {
			onDone();
		}
	}
</script>

<div class="flex h-dvh flex-col bg-gradient-primary" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
	<BlueHeader {countyName} />

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
		<Button variant="primary" fullWidth onclick={advance}>
			CONTINUE
		</Button>
		<Button variant="secondary" fullWidth onclick={advance}>
			SKIP
		</Button>
	</div>
</div>
