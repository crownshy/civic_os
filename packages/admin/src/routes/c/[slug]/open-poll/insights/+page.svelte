<script lang="ts">
	import type { PageProps } from './$types';
	import type { ReportComment, PolisReportData } from '$lib/types/report';
	import type { PolisStatementAux } from '$lib/types/aux';
	import { updateStatementAux } from '$lib/api/aux';
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
	import PollStatRow from '$lib/components/PollStatRow.svelte';

	let { data }: PageProps = $props();

	// Local mutable aux map so picker edits re-render without a refetch.
	// Re-seeded on every load (e.g. when slug changes).
	let auxByTid = $state<Record<number, PolisStatementAux>>(data.auxByTid);
	$effect(() => {
		auxByTid = data.auxByTid;
	});

	/**
	 * Overlay aux.themes onto each comment so the existing utils (which read
	 * `comment.topics`) get aux-sourced themes for free. Falls back to
	 * `comment.topics` when there's no aux row (e.g. sync hasn't been run).
	 */
	const reportData = $derived.by<PolisReportData | null>(() => {
		if (!data.reportData) return null;
		return {
			...data.reportData,
			comments: data.reportData.comments.map((c) => {
				const aux = auxByTid[c.tid];
				return aux ? { ...c, topics: aux.themes } : c;
			})
		};
	});

	const stats = $derived(reportData ? getEngagementStats(reportData) : null);
	const themes = $derived(reportData ? getThemeSummaries(reportData) : []);
	const consensus = $derived(reportData ? getConsensusStatements(reportData) : []);
	const differences = $derived(reportData ? getDifferenceStatements(reportData) : []);
	const uncertain = $derived(reportData ? getUncertaintyStatements(reportData) : []);

	/** All themes used anywhere on this conversation — powers the picker dropdown. */
	const availableThemes = $derived.by(() => {
		const set = new Set<string>();
		for (const row of Object.values(auxByTid)) {
			for (const t of row.themes) set.add(t);
		}
		return [...set].sort();
	});

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

	/**
	 * Persist a picker edit. Optimistic + roll-back on failure. No aux row
	 * means the statement hasn't been backfilled into comhairle yet — the
	 * picker is disabled for those, so this only fires for taggable rows.
	 */
	async function setThemesFor(tid: number, next: string[]) {
		const row = auxByTid[tid];
		if (!row) return;
		const prevThemes = row.themes;
		auxByTid = { ...auxByTid, [tid]: { ...row, themes: next } };
		try {
			const updated = await updateStatementAux(row.id, { themes: next });
			auxByTid = { ...auxByTid, [tid]: updated };
		} catch (e) {
			console.error('updateStatementAux themes failed', e);
			auxByTid = { ...auxByTid, [tid]: { ...row, themes: prevThemes } };
		}
	}
</script>

{#if data.error}
	<div class="text-destructive text-body p-8">Could not load report: {data.error}</div>
{:else if !reportData || !stats}
	<div class="text-muted-foreground text-body p-8">Loading report…</div>
{:else}
	<div class="flex flex-col gap-10 px-8 py-8">
		<!-- ===== Top stats ===== -->
		<PollStatRow
			stats={[
				{ label: 'Total Statements', value: stats.totalStatements },
				{ label: 'Themes', value: themes.length },
				{ label: 'Areas of Consensus', value: consensus.length }
			]}
		/>

		<!-- ===== Themes card ===== -->
		<section class="border-border bg-card shadow-card overflow-hidden rounded-2xl border">
			<header class="flex items-start justify-between gap-4 px-6 pt-6">
				<div>
					<h2 class="text-foreground text-section font-bold">Themes</h2>
					<p class="text-foreground/70 text-caption mt-1">What people were talking about.</p>
				</div>
				<FilterToggle label="Exclude host statements" bind:checked={themesExcludeHosts} />
			</header>

			<div class="px-6 pt-4 pb-2">
				<div
					class="text-muted-foreground/60 text-label grid grid-cols-[10rem_2.5rem_3rem_1fr_2rem] items-center gap-6 px-0 py-2 font-semibold uppercase"
				>
					<div>Theme</div>
					<div class="text-right">Count</div>
					<div class="text-right">Share</div>
					<div></div>
					<div></div>
				</div>
				{#if themes.length === 0}
					<p class="text-muted-foreground text-caption py-6 italic">
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
				<p class="text-muted-foreground text-caption px-4 py-6 italic">No consensus statements yet.</p>
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
				<p class="text-muted-foreground text-caption px-4 py-6 italic">No clear differences yet.</p>
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
				<p class="text-muted-foreground text-caption px-4 py-6 italic">
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
			<h2 class="text-foreground text-section font-bold">Theme Explorer</h2>

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
						<span class="text-muted-foreground text-caption italic">No themes yet.</span>
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
					class="text-muted-foreground/60 text-label grid grid-cols-[1.5rem_1fr_2.5rem_auto] items-center gap-4 px-4 py-2 font-semibold uppercase"
				>
					<div>#</div>
					<div>Statement</div>
					<div class="text-right">Count</div>
					<div class="pr-4">Groups</div>
				</div>

				{#if explorerStatements.length === 0}
					<p class="text-muted-foreground text-caption px-4 py-6 italic">
						No statements match the current filters.
					</p>
				{:else}
					{#each explorerStatements.slice(0, 50) as c, i (c.tid)}
						<StatementRow
							index={i + 1}
							comment={c}
							groups={reportData.groups}
							picker={{
								availableThemes,
								disabled: !auxByTid[c.tid],
								onChange: (next) => setThemesFor(c.tid, next)
							}}
						/>
					{/each}
				{/if}
			</div>
		</section>
	</div>
{/if}
