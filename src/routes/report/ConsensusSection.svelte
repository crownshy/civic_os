<script lang="ts">
	import type { CommentReportData } from '$lib/types/report';
	import Badge from '@civicos/shared/ui/Badge.svelte';

	interface Props {
		statements: CommentReportData[];
	}

	let { statements }: Props = $props();

	const thresholds = [60, 70, 80, 90] as const;
	let activeThreshold = $state<number>(60);

	const filteredStatements = $derived(
		statements
			.filter((s) => {
				const total = s.overall_votes.agrees + s.overall_votes.disagrees + s.overall_votes.passes;
				if (total === 0) return false;
				const agreePercent = (s.overall_votes.agrees / total) * 100;
				return agreePercent >= activeThreshold;
			})
			.sort((a, b) => {
				const totalA = a.overall_votes.agrees + a.overall_votes.disagrees + a.overall_votes.passes;
				const totalB = b.overall_votes.agrees + b.overall_votes.disagrees + b.overall_votes.passes;
				return b.overall_votes.agrees / totalB - a.overall_votes.agrees / totalA;
			})
	);

	function getAgreePercent(s: CommentReportData): number {
		const total = s.overall_votes.agrees + s.overall_votes.disagrees + s.overall_votes.passes;
		if (total === 0) return 0;
		return Math.round((s.overall_votes.agrees / total) * 100);
	}
</script>

<section class="relative overflow-hidden px-0 py-12" style="background: var(--gradient-consensus);">
	<!-- Decorative circles -->
	<div class="pointer-events-none absolute inset-0 flex justify-center overflow-hidden">
		<div
			class="absolute -top-10 left-1/2 h-120 w-120 min-w-[50vw] -translate-x-[65%] rounded-full outline outline-primary-foreground/20"
		></div>

		<div
			class="absolute -top-10 left-1/2 h-120 w-120 min-w-[50vw] -translate-x-[35%] rounded-full outline outline-primary-foreground/20"
		></div>
	</div>
	<div class="flex justify-center px-6">
		<Badge variant="dark" size="lg">CONSENSUS</Badge>
	</div>

	<div class="mt-4 px-8">
		<h2
			class="text-center font-display text-3xl leading-8 font-medium tracking-display text-primary-foreground"
		>
			In spite of differences, everyone seemed to agree on certain things.
		</h2>
	</div>

	<p class="mt-5 px-8 text-center font-sans text-base font-medium text-primary-foreground/80">
		These could be a strong foundation for future conversations, and opportunities for action.
	</p>

	<!-- Consensus card -->
	<div
		class="mx-6 mt-10 overflow-hidden rounded-[30px] bg-card shadow-[0px_4px_24.3px_0px_rgba(134,101,73,0.20)] outline -outline-offset-1 outline-border"
	>
		<!-- Threshold header -->
		<div class="flex flex-wrap items-center gap-2 px-5 pt-5">
			<span class="font-mono text-sm font-medium text-muted-foreground">BRIDGING THRESHOLD</span>
			<div class="flex items-center gap-1.5">
				{#each thresholds as threshold}
					<button onclick={() => (activeThreshold = threshold)} class="transition-colors">
						<Badge variant={activeThreshold === threshold ? 'dark' : 'soft'} size="md">
							{threshold}%
						</Badge>
					</button>
				{/each}
			</div>
		</div>

		<!-- Statement list -->
		<div class="mt-4">
			{#each filteredStatements as statement (statement.tid)}
				<div class="flex items-start gap-4 border-y border-border px-0 py-4">
					<div
						class="mt-2 ml-5 h-8 w-8 shrink-0 rounded-full border border-border bg-linear-to-b from-muted-foreground to-accent/0"
					></div>
					<div class="flex flex-1 flex-col pr-5">
						<p class="font-sans text-sm leading-6 font-semibold text-foreground">
							"{statement.text}"
						</p>
						<div class="mt-1">
							<Badge variant="primary-soft" size="sm">
								AT LEAST {getAgreePercent(statement)}% AGREE
							</Badge>
						</div>
					</div>
				</div>
			{/each}

			{#if filteredStatements.length === 0}
				<div class="px-5 py-12 text-center">
					<p class="font-sans text-sm text-muted-foreground">
						No statements meet the {activeThreshold}% agreement threshold.
					</p>
				</div>
			{/if}
		</div>
	</div>
</section>
