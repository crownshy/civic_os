<script lang="ts">
	import type { PageProps } from './$types';
	import type { ReportComment } from '$lib/types/report';
	import {
		getEngagementStats,
		getConsensusStatements,
		getDifferenceStatements,
		getUncertaintyStatements,
		getThemeSummaries,
		totalVotes
	} from '$lib/utils/report';
	import StatementRow from '$lib/components/insights/StatementRow.svelte';
	import StatementSection from '$lib/components/insights/StatementSection.svelte';
	import ThemeBar from '$lib/components/insights/ThemeBar.svelte';
	import ThemeChip from '$lib/components/insights/ThemeChip.svelte';
	import FilterToggle from '$lib/components/insights/FilterToggle.svelte';

	let { data }: PageProps = $props();

	const reportData = $derived(data.reportData);

	const stats = $derived(reportData ? getEngagementStats(reportData) : null);
	const themes = $derived(reportData ? getThemeSummaries(reportData) : []);
	const consensus = $derived(reportData ? getConsensusStatements(reportData) : []);
	const differences = $derived(reportData ? getDifferenceStatements(reportData) : []);
	const uncertain = $derived(reportData ? getUncertaintyStatements(reportData) : []);

	// --- Theme Explorer state ---
	let selectedTheme = $state<string | null>(null);
	let explorerExcludePasses = $state(false);
	let explorerExcludeHosts = $state(false);
	let themesExcludeHosts = $state(false);

	const explorerStatements = $derived.by(() => {
		if (!reportData) return [] as ReportComment[];
		let list: ReportComment[] = [...reportData.comments];
		if (explorerExcludeHosts) list = list.filter((c) => !c.is_seed);
		const theme = selectedTheme;
		if (theme) list = list.filter((c) => c.topics?.includes(theme));
		if (explorerExcludePasses) {
			list = list.filter((c) => {
				const t = totalVotes(c);
				return t > 0 && c.overall_votes.passes / t < 0.4;
			});
		}
		return list.sort((a, b) => totalVotes(b) - totalVotes(a));
	});

	function toggleTheme(theme: string) {
		selectedTheme = selectedTheme === theme ? null : theme;
	}
</script>

{#if data.error}
	<div class="text-destructive p-8">Could not load report: {data.error}</div>
{:else if !reportData || !stats}
	<div class="text-muted-foreground p-8">Loading report…</div>
{:else}
	<div class="flex flex-col gap-12 px-8 py-8">
		<!-- ===== Top stats ===== -->
		<section class="flex flex-wrap items-end gap-x-16 gap-y-6">
			<div>
				<div class="text-foreground/70 text-base font-medium">TOTAL STATEMENTS</div>
				<div class="text-foreground text-7xl font-extrabold">{stats.totalStatements}</div>
			</div>
			<div>
				<div class="text-foreground/70 text-base font-medium">THEMES</div>
				<div class="text-foreground text-7xl font-extrabold">{themes.length}</div>
			</div>
			<div>
				<div class="text-foreground/70 text-base font-medium">AREAS OF CONSENSUS</div>
				<div class="text-foreground text-7xl font-extrabold">{consensus.length}</div>
			</div>
		</section>

		<!-- ===== Themes card ===== -->
		<section
			class="border-border bg-card overflow-hidden rounded-2xl border"
		>
			<header class="flex items-start justify-between gap-4 px-8 pt-8">
				<div>
					<h2 class="text-foreground font-display text-3xl font-extrabold">Themes</h2>
					<p class="text-foreground/80 mt-2 text-base">What people were talking about.</p>
				</div>
				<FilterToggle
					label="Exclude host statements"
					bind:checked={themesExcludeHosts}
				/>
			</header>

			<div class="px-8 pt-6 pb-2">
				<div
					class="text-muted-foreground/60 grid grid-cols-[10rem_2.5rem_3rem_1fr_2rem] items-center gap-6 px-0 py-2 text-xs font-semibold uppercase"
				>
					<div>Theme</div>
					<div class="text-right">Count</div>
					<div class="text-right">Share</div>
					<div></div>
					<div></div>
				</div>
				{#if themes.length === 0}
					<p class="text-muted-foreground py-6 text-sm italic">
						No themes have been generated yet for this conversation.
					</p>
				{:else}
					{#each themes as t (t.theme)}
						<ThemeBar
							summary={t}
							total={stats.totalStatements}
							onclick={() => toggleTheme(t.theme)}
						/>
					{/each}
				{/if}
			</div>
		</section>

		<!-- ===== Areas of Consensus ===== -->
		<StatementSection
			title="Areas of Consensus"
			description="Statements where all groups strongly agreed with the statement (80%+)."
		>
			{#if consensus.length === 0}
				<p class="text-muted-foreground px-4 py-6 text-sm italic">No consensus statements yet.</p>
			{:else}
				{#each consensus as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="consensus"
						showVerdictPill
					/>
				{/each}
			{/if}
		</StatementSection>

		<!-- ===== Areas of Difference ===== -->
		<StatementSection
			title="Areas of Difference"
			description="Statements where the spread between the groups was equal to or greater than 30%."
		>
			{#if differences.length === 0}
				<p class="text-muted-foreground px-4 py-6 text-sm italic">No clear differences yet.</p>
			{:else}
				{#each differences as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="difference"
						showVerdictPill
					/>
				{/each}
			{/if}
		</StatementSection>

		<!-- ===== Areas of Uncertainty ===== -->
		<StatementSection
			title="Areas of Uncertainty"
			description="Statements where the percentage of people who passed was significantly higher than average."
		>
			{#if uncertain.length === 0}
				<p class="text-muted-foreground px-4 py-6 text-sm italic">
					No statements of unusual uncertainty yet.
				</p>
			{:else}
				{#each uncertain as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="uncertainty"
						showVerdictPill
					/>
				{/each}
			{/if}
		</StatementSection>

		<!-- ===== Theme Explorer ===== -->
		<section class="flex flex-col gap-4">
			<h2 class="text-foreground text-3xl font-semibold">Theme Explorer</h2>

			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="flex flex-wrap gap-2">
					{#each themes as t (t.theme)}
						<ThemeChip
							label={t.theme}
							selected={selectedTheme === t.theme}
							onclick={() => toggleTheme(t.theme)}
						/>
					{/each}
					{#if themes.length === 0}
						<span class="text-muted-foreground text-sm italic">No themes yet.</span>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					<FilterToggle label="Exclude passes" bind:checked={explorerExcludePasses} />
					<FilterToggle
						label="Exclude host statements"
						bind:checked={explorerExcludeHosts}
					/>
				</div>
			</div>

			<div class="flex flex-col">
				<div
					class="text-muted-foreground/60 grid grid-cols-[1.5rem_1fr_2.5rem_auto] items-center gap-4 px-4 py-2 text-xs font-semibold uppercase"
				>
					<div>#</div>
					<div>Statement</div>
					<div class="text-right">Count</div>
					<div class="pr-4">Groups</div>
				</div>

				{#if explorerStatements.length === 0}
					<p class="text-muted-foreground px-4 py-6 text-sm italic">
						No statements match the current filters.
					</p>
				{:else}
					{#each explorerStatements.slice(0, 50) as c, i (c.tid)}
						<StatementRow
							index={i + 1}
							comment={c}
							groups={reportData.groups}
						/>
					{/each}
				{/if}
			</div>
		</section>
	</div>
{/if}
