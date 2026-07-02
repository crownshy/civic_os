<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { InfoBar, Button } from '$lib/components/ui';
	import { Check } from 'lucide-svelte';
	import type { AboutYouQuestion } from '$lib/types/mock-data';
	import type { RegionConfig } from '$lib/config/regions';

	interface Props {
		/** The political-leaning question (about-004) — single source of truth for options. */
		question: AboutYouQuestion;
		countyName: string;
		region: RegionConfig;
		/** Called with the selected option string once the user hits CONTINUE. */
		onDone: (politicalParty: string) => void;
	}

	let { question, countyName, region, onDone }: Props = $props();

	let selected = $state<string | null>(null);
	let submitting = $state(false);

	async function handleContinue() {
		if (selected === null || submitting) return;
		submitting = true;
		await onDone(selected);
	}
</script>

<!--
  Utah-only mandatory political-leaning step, shown after joining and before Polis.
  Copy below is a working draft — safe to reword. Options come from about-004 so the
  early answer and the end-of-flow prefill stay string-identical.
-->
<div class="flex h-full flex-col bg-gradient-primary">
	<InfoBar {region} {countyName} />

	<div class="flex flex-1 flex-col overflow-y-auto px-6 pt-8">
		<span
			class="font-mono text-sm font-medium text-foreground/80"
			in:fly={{ y: -10, duration: 300, delay: 100, easing: cubicOut }}>ONE QUICK THING</span
		>

		<p
			class="mt-4 font-display text-4xl leading-9 font-medium tracking-display text-foreground"
			in:fly={{ y: 10, duration: 400, delay: 200, easing: cubicOut }}
		>
			Where do you land, politically?
		</p>

		<p
			class="mt-3 font-sans text-sm font-medium text-foreground"
			in:fly={{ y: 10, duration: 400, delay: 300, easing: cubicOut }}
		>
			This helps make sure the conversation reflects the whole political spectrum — not just one
			side. Your response is anonymous.
		</p>

		<div class="mt-8 flex flex-col gap-2 pb-12">
			{#each question.options as option, idx (option)}
				<button
					onclick={() => (selected = option)}
					class="relative flex min-h-16 w-full items-center rounded-[20px] px-6 py-3 text-left font-sans text-lg leading-6 font-bold transition-all duration-300 {selected ===
					option
						? 'bg-card text-foreground shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)]'
						: 'bg-secondary/10 text-foreground/70 hover:bg-secondary/15'}"
					in:fly={{ y: 15, delay: 400 + idx * 80, duration: 400, easing: cubicOut }}
				>
					<span class="flex-1 pr-10">{option}</span>
					{#if selected === option}
						<span
							class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground"
						>
							<Check class="h-3.5 w-3.5 stroke-3 text-card" />
						</span>
					{:else}
						<span class="absolute right-5 h-8 w-8 rounded-full border-2 border-foreground/40"
						></span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex shrink-0 items-center gap-3.5 border-t border-secondary/70 bg-accent px-7 py-8">
		<Button
			variant="primary"
			fullWidth
			disabled={selected === null || submitting}
			onclick={handleContinue}
		>
			CONTINUE
		</Button>
	</div>
</div>
