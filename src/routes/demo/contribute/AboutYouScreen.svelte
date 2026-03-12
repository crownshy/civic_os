<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { AboutYouQuestion } from '$lib/types/mock-data';
	import { AboutBar, Button } from '$lib/components/ui';

	interface Props {
		countyName: string;
		questions: AboutYouQuestion[];
		zipCode?: string;
		onDone: (demographics?: { age?: string; ethnicity?: string; gender?: string }) => void;
		onSkip?: () => void;
	}

	let { countyName, questions, zipCode = '', onDone, onSkip }: Props = $props();

	// Track which category is expanded (null = none)
	let expandedCategory = $state<string | null>(null);

	// Selections per question ID
	let selections = $state<Record<string, Set<number>>>({});

	// Zip code state (pre-filled from landing)
	let localZip = $state(zipCode);

	function toggleCategory(id: string) {
		expandedCategory = expandedCategory === id ? null : id;
	}

	function toggleOption(questionId: string, idx: number, multiSelect: boolean) {
		const current = selections[questionId] ?? new Set<number>();
		const next = new Set(current);
		if (multiSelect) {
			if (next.has(idx)) next.delete(idx);
			else next.add(idx);
		} else {
			next.clear();
			next.add(idx);
		}
		selections = { ...selections, [questionId]: next };

		// Auto-collapse single-select categories after choosing
		if (!multiSelect) {
			setTimeout(() => { expandedCategory = null; }, 250);
		}
	}

	function getSelectionLabel(q: AboutYouQuestion): string {
		const sel = selections[q.id];
		if (!sel || sel.size === 0) return q.question.split(' ').slice(-1)[0] === '?' ? q.question.replace('What is your ', '').replace('?', '') : q.question;
		return [...sel].map((i) => q.options[i]).join(', ');
	}

	function hasSelection(questionId: string): boolean {
		const sel = selections[questionId];
		return !!sel && sel.size > 0;
	}

	function collectDemographics(): { age?: string; ethnicity?: string; gender?: string } {
		const result: { age?: string; ethnicity?: string; gender?: string } = {};
		for (const q of questions) {
			const sel = selections[q.id];
			if (!sel || sel.size === 0) continue;
			const values = [...sel].map((i) => q.options[i]).join(', ');
			if (q.id === 'about-001') result.age = values;
			else if (q.id === 'about-002') result.ethnicity = values;
			else if (q.id === 'about-003') result.gender = values;
		}
		return result;
	}
</script>

<div class="flex h-full flex-col bg-gradient-primary">
	<AboutBar {countyName} />

	<!-- Scrollable content -->
	<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-8">
		<span class="font-mono text-sm font-medium text-white/80">BEFORE YOU GO...</span>
		<p class="mt-4 font-sans text-4xl font-bold leading-9 text-white">
			Can you share more about yourself?
		</p>
		<p class="mt-3 font-sans text-sm font-medium text-white/80">
			This information helps us make sure everyone is represented in the conversation. You can share only as much as you'd like to.
		</p>

		<!-- WHERE ARE YOU? section -->
		<span class="mt-8 font-mono text-sm font-medium text-white/80">WHERE ARE YOU?</span>
		<button
			class="mt-2 relative flex h-16 w-full items-center rounded-[20px] px-6 text-left font-sans text-2xl font-bold leading-7 {localZip
				? 'bg-white text-secondary shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
				: 'bg-secondary text-white opacity-70'}"
			onclick={() => {/* zip is pre-filled from landing */}}
		>
			{localZip || 'Zip Code'}
			{#if localZip}
				<span class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
					<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</span>
			{/if}
		</button>

		<!-- DEMOGRAPHICS section -->
		<span class="mt-8 font-mono text-sm font-medium text-white/80">DEMOGRAPHICS</span>
		<div class="mt-2 flex flex-col gap-2">
			{#each questions as q}
				{#if expandedCategory === q.id}
					<!-- Expanded: show options -->
					<div class="flex flex-col gap-2">
						{#each q.options as option, i}
							<button
								onclick={() => toggleOption(q.id, i, q.multiSelect)}
								class="relative flex h-16 w-full items-center rounded-[20px] px-6 text-left font-sans text-2xl font-bold leading-7 transition-colors {(selections[q.id] ?? new Set()).has(i)
									? 'bg-white text-secondary shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
									: 'bg-secondary text-white'}"
							>
								{option}
								{#if (selections[q.id] ?? new Set()).has(i)}
									<span class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
										<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									</span>
								{/if}
							</button>
						{/each}
						{#if q.multiSelect}
							<button
								onclick={() => { expandedCategory = null; }}
								class="mt-1 font-mono text-sm font-medium text-white/80 text-left"
							>
								DONE ✓
							</button>
						{/if}
					</div>
				{:else}
					<!-- Collapsed: summary row -->
					<button
						onclick={() => toggleCategory(q.id)}
						class="relative flex h-16 w-full items-center rounded-[20px] px-6 text-left font-sans text-2xl font-bold leading-7 transition-colors {hasSelection(q.id)
							? 'bg-white text-secondary shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)]'
							: 'bg-secondary text-white opacity-70'}"
					>
						{#if hasSelection(q.id)}
							{getSelectionLabel(q)}
							<span class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
								<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</span>
						{:else}
							{q.id === 'about-001' ? 'Age' : q.id === 'about-002' ? 'Ethnicity' : q.id === 'about-003' ? 'Gender' : q.question}
						{/if}
					</button>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Bottom actions — single CONTINUE only -->
	<div class="flex shrink-0 items-center gap-3.5 border-t border-background bg-secondary px-7 py-8">
		<Button variant="primary" fullWidth onclick={() => onDone(collectDemographics())}>
			CONTINUE
		</Button>
	</div>
</div>