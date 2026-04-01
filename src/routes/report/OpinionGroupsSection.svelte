<script lang="ts">
	import type { CommentReportData, GroupReportData } from '$lib/types/report';
	import SectionLabel from './SectionLabel.svelte';

	interface Props {
		statements: CommentReportData[];
		groups: GroupReportData[];
		totalVotes: number;
		statementCount: number;
		groupLabels: readonly string[];
	}

	let { statements, groups, totalVotes, statementCount, groupLabels }: Props = $props();

	let currentStatementIndex = $state(0);

	const divisiveStatements = $derived(
		statements
			.filter((s) => s.group_votes.length >= 2)
			.sort((a, b) => (b.divisiveness ?? 0) - (a.divisiveness ?? 0))
			.slice(0, 6)
	);

	const currentStatement = $derived(divisiveStatements[currentStatementIndex]);

	function nextStatement() {
		if (currentStatementIndex < divisiveStatements.length - 1) {
			currentStatementIndex++;
		}
	}

	function prevStatement() {
		if (currentStatementIndex > 0) {
			currentStatementIndex--;
		}
	}

	function getGroupPercents(statement: CommentReportData, groupId: number) {
		const gv = statement.group_votes.find((g) => g.group_id === groupId);
		if (!gv) return { agree: 0, disagree: 0, pass: 0 };
		const total = gv.agrees + gv.disagrees + gv.passes;
		if (total === 0) return { agree: 0, disagree: 0, pass: 0 };
		return {
			agree: Math.round((gv.agrees / total) * 100),
			disagree: Math.round((gv.disagrees / total) * 100),
			pass: Math.round((gv.passes / total) * 100)
		};
	}

	const barMaxWidth = 240;
</script>

<section class="relative overflow-hidden bg-background py-6">
	<!-- Decorative circles -->
	<div
		class="pointer-events-none absolute -right-20 top-16 h-80 w-80 rounded-full opacity-40 outline outline-[0.8px] outline-neutral-600"
	></div>
	<div
		class="pointer-events-none absolute -left-32 -top-5 h-80 w-80 rounded-full opacity-40 outline outline-[0.8px] outline-destructive"
	></div>

	<div class="px-6">
		<SectionLabel>OPINION GROUPS</SectionLabel>
	</div>

	<div class="mt-8 px-8">
		<h2 class="font-sans text-3xl font-bold leading-8 text-foreground">
			After analyzing
			<span class="text-destructive"
				>{totalVotes.toLocaleString()} votes on {statementCount} statements,</span
			>
			we found a few patterns...
		</h2>
	</div>

	<p class="mt-5 px-8 font-sans text-base font-medium text-foreground">
		The following groups are not based on demographics, but on voting patterns. Flip through the
		statements to get a sense of where people differ on this issue.
	</p>

	<!-- Statement flipper card -->
	{#if currentStatement}
		<div
			class="mx-6 mt-10 overflow-hidden rounded-[30px] bg-linear-to-b from-white/90 to-white/0 p-5 shadow-[0px_4px_24.3px_0px_rgba(134,101,73,0.20)] outline outline-1 outline-offset-[-1px] outline-stone-500/20"
		>
			<!-- Statement counter -->
			<div class="font-mono text-xs font-medium text-black/60">
				STATEMENT {currentStatementIndex + 1} OF {divisiveStatements.length}
			</div>

			<!-- Statement text with navigation -->
			<div class="mt-3 flex items-center gap-3">
				<button
					onclick={prevStatement}
					disabled={currentStatementIndex === 0}
					class="shrink-0 rounded-full p-1 text-foreground/40 transition-colors hover:text-foreground disabled:opacity-20"
					aria-label="Previous statement"
				>
					←
				</button>

				<div
					class="flex items-center gap-5 rounded-[10px] border-b border-background bg-background px-5 py-4"
				>
					<div
						class="h-8 w-8 shrink-0 rounded-full bg-linear-to-b from-background to-orange-200 outline outline-[0.54px] outline-stone-500/20"
					></div>
					<p class="font-sans text-sm font-semibold leading-4 text-foreground">
						"{currentStatement.text}"
					</p>
				</div>

				<button
					onclick={nextStatement}
					disabled={currentStatementIndex === divisiveStatements.length - 1}
					class="shrink-0 rounded-full p-1 text-foreground/40 transition-colors hover:text-foreground disabled:opacity-20"
					aria-label="Next statement"
				>
					→
				</button>
			</div>

			<!-- Bar chart -->
			<div class="mt-6">
				<!-- Axis labels -->
				<div class="mb-2 flex items-center pl-20">
					<span class="font-mono text-xs text-stone-500/60">0%</span>
					<span class="ml-[22%] font-mono text-xs text-stone-500/60">25</span>
					<span class="ml-[22%] font-mono text-xs text-stone-500/60">50</span>
					<span class="ml-[22%] font-mono text-xs text-stone-500/60">75</span>
					<span class="ml-auto font-mono text-xs text-stone-500/60">100</span>
				</div>

				<!-- Grid lines + bars -->
				{#each groups as group, gi}
					{@const percents = getGroupPercents(currentStatement, group.group_id)}
					<div class="mb-6 flex items-center">
						<span class="w-20 shrink-0 font-mono text-sm font-medium text-stone-500">
							{groupLabels[gi] ?? `GROUP ${String.fromCharCode(65 + gi)}`}
						</span>
						<div class="relative flex h-8 flex-1 items-center">
							<!-- Grid lines -->
							<div
								class="pointer-events-none absolute inset-0 flex items-stretch"
							>
								{#each [0, 25, 50, 75, 100] as tick}
									<div
										class="absolute top-0 h-full border-l border-stone-500/20"
										style="left: {tick}%"
									></div>
								{/each}
							</div>
							<!-- Stacked bars -->
							<div class="flex h-1.5 w-full">
								{#if percents.agree > 0}
									<div
										class="bg-teal-600"
										style="width: {percents.agree}%"
									></div>
								{/if}
								{#if percents.disagree > 0}
									<div
										class="bg-red-400"
										style="width: {percents.disagree}%"
									></div>
								{/if}
								{#if percents.pass > 0}
									<div
										class="bg-zinc-300"
										style="width: {percents.pass}%"
									></div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Legend -->
			<div class="mt-2 flex items-center justify-center gap-5">
				<div class="flex items-center gap-1.5">
					<div class="h-3 w-3 rounded-full bg-teal-600"></div>
					<span class="font-mono text-xs font-medium text-stone-500">AGREE</span>
				</div>
				<div class="flex items-center gap-1.5">
					<div class="h-3 w-3 rounded-full bg-red-400"></div>
					<span class="font-mono text-xs font-medium text-stone-500">DISAGREE</span>
				</div>
				<div class="flex items-center gap-1.5">
					<div class="h-3 w-3 rounded-full bg-zinc-300"></div>
					<span class="font-mono text-xs font-medium text-stone-500">PASS/UNSURE</span>
				</div>
			</div>
		</div>
	{/if}
</section>
