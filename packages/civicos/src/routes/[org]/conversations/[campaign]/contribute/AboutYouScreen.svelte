<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { AboutYouQuestion, DemographicKey } from '$lib/config/participation';
	import { InfoBar, Button, Dialog, Link } from '$lib/components/ui';
	import { Check, Plus } from 'lucide-svelte';
	import type { RegionConfig } from '$lib/config/regions';

	interface Props {
		countyName: string;
		/**
		 * The categories the Host left switched on, already filtered. The screen
		 * renders what it is handed and keys answers on the category, so turning
		 * one off in admin is the only thing that removes it.
		 */
		questions: AboutYouQuestion[];
		zipCode?: string;
		region: RegionConfig;
		onDone: (demographics?: Partial<Record<DemographicKey, string>>) => void;
		onSkip?: () => void;
	}

	let { countyName, questions, zipCode = '', onDone, onSkip, region }: Props = $props();

	let openDialog = $state<DemographicKey | null>(null);
	let dialogOpen = $derived(openDialog !== null);
	// One option per category: every category admin defines is single-select.
	let selections = $state<Partial<Record<DemographicKey, number>>>({});

	function openCategory(key: DemographicKey) {
		openDialog = key;
	}

	function closeDialog() {
		openDialog = null;
	}

	function selectOption(key: DemographicKey, idx: number) {
		selections = { ...selections, [key]: idx };
	}

	function selectionLabel(q: AboutYouQuestion): string {
		const idx = selections[q.key];
		return idx === undefined ? '' : q.options[idx];
	}

	function collectDemographics(): Partial<Record<DemographicKey, string>> {
		const result: Partial<Record<DemographicKey, string>> = {};
		for (const q of questions) {
			const label = selectionLabel(q);
			if (label) result[q.key] = label;
		}
		return result;
	}

	let dialogQuestion = $derived(questions.find((q) => q.key === openDialog) ?? null);
</script>

<div class="flex h-full flex-col bg-gradient-primary">
	<InfoBar {region} {countyName} />

	<div class="flex flex-1 flex-col overflow-y-auto px-6 pt-8">
		<span
			class="font-mono text-sm font-medium text-foreground/80"
			in:fly={{ y: -10, duration: 300, delay: 100, easing: cubicOut }}>BEFORE YOU GO...</span
		>

		<p
			class="mt-4 font-display text-4xl leading-9 font-medium tracking-display text-foreground"
			in:fly={{ y: 10, duration: 400, delay: 200, easing: cubicOut }}
		>
			Help {region.stateName} see itself.
		</p>

		<p
			class="mt-3 font-sans text-sm font-medium text-foreground"
			in:fly={{ y: 10, duration: 400, delay: 300, easing: cubicOut }}
		>
			This conversation is richer when it reflects the full range of {region.stateName}. Sharing a
			little about yourself helps the whole community see who's in this conversation — and whose
			voices might still be missing.
		</p>
		<p
			class="mt-3 font-sans text-sm font-medium text-foreground"
			in:fly={{ y: 10, duration: 400, delay: 300, easing: cubicOut }}
		>
			Every question is optional. Share only what you're comfortable with.
		</p>

		<p
			class="mt-3 font-sans text-sm font-medium text-foreground"
			in:fly={{ y: 10, duration: 400, delay: 300, easing: cubicOut }}
		>
			See our full privacy terms <Link
				href="https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1"
				external>here</Link
			>.
		</p>

		<div class="mt-8 flex flex-col gap-2 pb-12">
			{#each questions as q, qIdx (q.key)}
				<button
					onclick={() => openCategory(q.key)}
					class="relative flex h-16 w-full items-center rounded-[20px] text-left font-sans text-2xl leading-7 font-bold transition-all duration-300 {selectionLabel(
						q
					)
						? 'bg-card text-foreground shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)]'
						: 'bg-secondary/10 text-foreground/70 hover:bg-secondary/15'}"
					in:fly={{ y: 15, delay: 400 + qIdx * 80, duration: 400, easing: cubicOut }}
				>
					{#if selectionLabel(q)}
						<span class="absolute right-16 left-6 truncate">
							{selectionLabel(q)}
						</span>
						<span
							class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground"
						>
							<Check class="h-3.5 w-3.5 stroke-3 text-card" />
						</span>
					{:else}
						<span class="absolute right-16 left-6 truncate">
							{q.title}?
						</span>
						<span
							class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/40"
						>
							<Plus class="h-3 w-3 stroke-3 text-accent" />
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex shrink-0 items-center gap-3.5 border-t border-secondary/70 bg-accent px-7 py-8">
		<Button variant="primary" fullWidth onclick={() => onDone(collectDemographics())}>
			CONTINUE
		</Button>
	</div>
</div>

{#if dialogQuestion}
	{@const dq = dialogQuestion}
	<Dialog
		open={dialogOpen}
		title={dq.title}
		description={dq.prompt}
		buttonText="SUBMIT"
		onButtonClick={closeDialog}
		onOpenChange={(v) => {
			if (!v) closeDialog();
		}}
	>
		<div class="mt-6">
			{#each dq.options as option, i (option)}
				<button
					onclick={() => selectOption(dq.key, i)}
					class="relative flex h-16 w-full items-center border-b border-foreground/20 px-7 text-left font-sans text-lg leading-5 font-bold transition-colors hover:bg-accent/30 {selections[
						dq.key
					] === i
						? 'bg-accent/30 text-foreground'
						: 'text-foreground/70'}"
				>
					<span class="flex-1">{option}</span>
					{#if selections[dq.key] === i}
						<span
							class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground"
						>
							<Check class="h-2.5 w-2.5 stroke-[2.5] text-card" />
						</span>
					{:else}
						<span class="h-5 w-5 shrink-0 rounded-full border-2 border-foreground/50"></span>
					{/if}
				</button>
			{/each}
		</div>
	</Dialog>
{/if}
