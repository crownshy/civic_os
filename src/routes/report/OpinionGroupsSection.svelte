<script lang="ts">
	import type { CommentReportData, GroupReportData } from '$lib/types/report';
	import Badge from '$lib/components/ui/Badge.svelte';
	import GradientCard from '$lib/components/ui/GradientCard.svelte';
	import SwipeCarousel from '$lib/components/ui/SwipeCarousel.svelte';

	interface Props {
		statements: CommentReportData[];
		groups: GroupReportData[];
		totalVotes: number;
		statementCount: number;
		groupLabels: readonly string[];
	}

	let { statements, groups, totalVotes, statementCount, groupLabels }: Props = $props();

	let selectedGroup = $state(0);
	let currentStatementIndex = $state(0);

	const divisiveStatements = $derived(
		statements
			.filter((s) => s.group_votes.length >= 2)
			.sort((a, b) => (b.divisiveness ?? 0) - (a.divisiveness ?? 0))
			.slice(0, 6)
	);

	function selectGroup(i: number) {
		selectedGroup = i;
		currentStatementIndex = 0;
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

	const selectedGroupLetter = $derived(String.fromCharCode(65 + selectedGroup));
</script>

<section class="relative overflow-hidden bg-background py-6">
	<!-- Decorative circles -->
	<div
		class="pointer-events-none absolute -right-20 top-16 h-80 w-80 rounded-full opacity-40 outline outline-foreground"
	></div>
	<div
		class="pointer-events-none absolute -left-32 -top-5 h-80 w-80 rounded-full opacity-40 outline outline-destructive"
	></div>

	<div class="relative z-10 px-6">
		<Badge variant="soft" size="lg">OPINION GROUPS</Badge>
	</div>

	<div class="relative z-10 mt-8 px-8">
		<h2 class="font-sans text-3xl font-bold leading-8 text-foreground">
			After analyzing
			<span class="text-destructive"
				>{totalVotes.toLocaleString()} votes on {statementCount} statements,</span
			>
			we found a few patterns...
		</h2>
	</div>

	<p class="relative z-10 mt-5 px-8 font-sans text-base font-medium text-foreground">
		The following groups are not based on demographics, but on voting patterns. Flip through the
		statements to get a sense of where people differ on this issue.
	</p>

	<!-- Statement flipper card -->
	{#if divisiveStatements.length > 0}
		<GradientCard
			borderGradient="bg-linear-to-b from-border to-transparent"
			bg="bg-linear-to-b from-card to-background"
			shadow="shadow-[0px_4px_24.3px_0px_rgba(134,101,73,0.20)]"
			class="relative z-10 mx-6 mt-10"
		>
			<!-- Group selection header -->
			<div class="flex items-center justify-between px-5 pt-5">
				<span class="font-mono text-xs font-medium text-muted-foreground">GROUP SELECTION</span>
				<div class="flex items-center gap-[5px]">
					{#each groups as _, gi}
						<button
							onclick={() => selectGroup(gi)}
							class="flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-medium transition-colors {selectedGroup === gi
								? 'bg-foreground text-background'
								: 'bg-secondary/10 text-foreground'}"
						>
							{String.fromCharCode(65 + gi)}
						</button>
					{/each}
				</div>
			</div>

			<!-- Subtitle -->
			<div class="px-5 pt-3">
				<span class="font-mono text-xs font-medium text-muted-foreground">
					STATEMENTS THAT SET GROUP {selectedGroupLetter} APART
				</span>
			</div>

			<!-- Swipeable statements -->
			<SwipeCarousel count={divisiveStatements.length} bind:index={currentStatementIndex} hideDots={true}>
				{#snippet children(i)}
					{@const statement = divisiveStatements[i]}
					<div class="px-5 pb-2 pt-4">
						<!-- Statement text card -->
						<div
							class="flex items-center gap-5 rounded-[10px] border-b border-muted bg-muted px-5 py-4"
						>
							<div
								class="h-8 w-8 shrink-0 rounded-full bg-linear-to-b from-background to-accent outline outline-[0.54px] outline-border"
							></div>
							<p class="font-sans text-sm font-semibold leading-4 text-foreground">
								"{statement.text}"
							</p>
						</div>

						<!-- Bar chart -->
						<div class="mt-5">
							<!-- Axis labels -->
							<div class="mb-2 flex items-center pl-20">
								<span class="font-mono text-xs text-muted-foreground/60">0%</span>
								<span class="ml-[22%] font-mono text-xs text-muted-foreground/60">25</span>
								<span class="ml-[22%] font-mono text-xs text-muted-foreground/60">50</span>
								<span class="ml-[22%] font-mono text-xs text-muted-foreground/60">75</span>
								<span class="ml-auto font-mono text-xs text-muted-foreground/60">100</span>
							</div>

							<!-- Groups with vertical stacked bars -->
							{#each groups as group, gi}
								{@const percents = getGroupPercents(statement, group.group_id)}
								{@const isSelected = gi === selectedGroup}
								<div class="mb-4">
									<!-- Group label -->
									<span
									class="font-mono text-sm font-medium leading-4 {isSelected
										? 'text-primary underline'
										: 'text-muted-foreground'}"
									>
										{groupLabels[gi] ?? `GROUP ${String.fromCharCode(65 + gi)}`}
									</span>

									<!-- Vertical stacked bars with grid -->
									<div class="relative ml-0 mt-1.5 flex flex-col gap-1">
										<!-- Grid lines -->
										<div class="pointer-events-none absolute inset-0">
											{#each [0, 25, 50, 75, 100] as tick}
												<div
													class="absolute top-0 h-full border-l border-border"
													style="left: {tick}%"
												></div>
											{/each}
										</div>
										<!-- Agree bar -->
										<div class="h-1.5 bg-primary" style="width: {percents.agree}%"></div>
									<!-- Disagree bar -->
									<div class="h-1.5 bg-destructive" style="width: {percents.disagree}%"></div>
									<!-- Pass bar -->
									<div class="h-1.5 bg-input" style="width: {percents.pass}%"></div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/snippet}
			</SwipeCarousel>

			<!-- Legend (outside carousel) -->
			<div class="flex items-center justify-center gap-5 px-5 pb-5">
				<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full bg-primary"></div>
				<span class="font-mono text-xs font-medium text-muted-foreground">AGREE</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full bg-destructive"></div>
				<span class="font-mono text-xs font-medium text-muted-foreground">DISAGREE</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full bg-input"></div>
				<span class="font-mono text-xs font-medium text-muted-foreground">PASS/UNSURE</span>
			</div>
			</div>
		</GradientCard>
	{/if}
</section>
