<script lang="ts">
	import type { CommentReportData } from '$lib/types/report';
	import SectionLabel from './SectionLabel.svelte';

	interface Props {
		statements: CommentReportData[];
	}

	let { statements }: Props = $props();

	const thresholds = [60, 70, 80, 90] as const;
	let activeThreshold = $state<number>(60);

	const filteredStatements = $derived(
		statements
			.filter((s) => {
				const total =
					s.overall_votes.agrees + s.overall_votes.disagrees + s.overall_votes.passes;
				if (total === 0) return false;
				const agreePercent = (s.overall_votes.agrees / total) * 100;
				return agreePercent >= activeThreshold;
			})
			.sort((a, b) => {
				const totalA =
					a.overall_votes.agrees + a.overall_votes.disagrees + a.overall_votes.passes;
				const totalB =
					b.overall_votes.agrees + b.overall_votes.disagrees + b.overall_votes.passes;
				return b.overall_votes.agrees / totalB - a.overall_votes.agrees / totalA;
			})
	);

	function getAgreePercent(s: CommentReportData): number {
		const total = s.overall_votes.agrees + s.overall_votes.disagrees + s.overall_votes.passes;
		if (total === 0) return 0;
		return Math.round((s.overall_votes.agrees / total) * 100);
	}
</script>

<section
	class="relative overflow-hidden bg-linear-to-b from-green-800 to-green-950 px-0 py-12"
>
	<!-- Decorative circles -->
	<div
		class="pointer-events-none absolute -left-20 -top-4 h-96 w-96 rounded-full outline outline-1 outline-white/20"
	></div>
	<div
		class="pointer-events-none absolute left-[28%] -top-4 h-96 w-96 rounded-full outline outline-1 outline-white/20"
	></div>

	<div class="flex justify-center px-6">
		<SectionLabel class="bg-green-950 text-white">CONSENSUS</SectionLabel>
	</div>

	<div class="mt-8 px-8">
		<h2 class="text-center font-sans text-3xl font-bold leading-8 text-white">
			In spite of differences, everyone seemed to agree on certain things.
		</h2>
	</div>

	<p class="mt-5 px-8 text-center font-sans text-base font-medium text-white/80">
		These could be a strong foundation for future conversations, and opportunities for action.
	</p>

	<!-- Consensus card -->
	<div
		class="mx-6 mt-10 overflow-hidden rounded-[30px] bg-white shadow-[0px_4px_24.3px_0px_rgba(134,101,73,0.20)] outline outline-1 outline-offset-[-1px] outline-stone-500/20"
	>
		<!-- Threshold header -->
		<div class="flex flex-wrap items-center gap-2 px-5 pt-5">
			<span class="font-mono text-sm font-medium text-black/60">BRIDGING THRESHOLD</span>
			<div class="flex items-center gap-1.5">
				{#each thresholds as threshold}
					<button
						onclick={() => (activeThreshold = threshold)}
						class="rounded-full px-2.5 py-1 font-mono text-xs font-medium transition-colors {activeThreshold ===
						threshold
							? 'bg-primary text-stone-50'
							: 'bg-secondary/10 text-foreground'}"
					>
						{threshold}%
					</button>
				{/each}
			</div>
		</div>

		<!-- Statement list -->
		<div class="mt-4">
			{#each filteredStatements as statement (statement.tid)}
				<div class="flex items-start gap-4 border-y border-secondary/20 px-0 py-4">
					<div
						class="ml-5 mt-2 h-8 w-8 shrink-0 rounded-full border border-stone-500/10 bg-linear-to-b from-stone-500 to-amber-100/0"
					></div>
					<div class="flex flex-1 flex-col pr-5">
						<p class="font-sans text-sm font-semibold leading-6 text-foreground">
							"{statement.text}"
						</p>
						<div class="mt-1">
							<span
								class="inline-flex items-center rounded-[10px] bg-primary/10 px-1.5 py-px font-mono text-[10px] font-medium leading-4 text-primary"
							>
								AT LEAST {getAgreePercent(statement)}% AGREE
							</span>
						</div>
					</div>
				</div>
			{/each}

			{#if filteredStatements.length === 0}
				<div class="px-5 py-12 text-center">
					<p class="font-sans text-sm text-stone-400">
						No statements meet the {activeThreshold}% agreement threshold.
					</p>
				</div>
			{/if}
		</div>
	</div>
</section>
