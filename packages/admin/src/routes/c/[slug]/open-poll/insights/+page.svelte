<script lang="ts">
	import type { PageProps } from './$types';
	import type { ReportComment, PolisReportData } from '$lib/types/report';
	import type { PolisStatementAux } from '$lib/types/aux';
	import {
		addStatementAuxTheme,
		moderateStatementAux,
		removeStatementAuxTheme
	} from '$lib/api/aux';
	import {
		getEngagementStats,
		getConsensusStatements,
		getDifferenceStatements,
		getThemeSummaries,
		totalVotes
	} from '$lib/utils/report';
	import { buildStatementsCsv, downloadCsv } from '$lib/utils/report-csv';
	import StatementRow from '$lib/components/insights/StatementRow.svelte';
	import StatementSection from '$lib/components/insights/StatementSection.svelte';
	import ThemeBar from '$lib/components/insights/ThemeBar.svelte';
	import ThemeChip from '$lib/components/insights/ThemeChip.svelte';
	import FilterToggle from '$lib/components/insights/FilterToggle.svelte';
	import PollStatRow from '$lib/components/PollStatRow.svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Download, ChevronDown } from '@lucide/svelte';

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

	let themesExcludeHosts = $state(false);

	const stats = $derived(reportData ? getEngagementStats(reportData) : null);
	const themes = $derived.by(() => {
		if (!reportData) return [];
		const source = themesExcludeHosts
			? { ...reportData, comments: reportData.comments.filter((c) => !c.is_seed) }
			: reportData;
		return getThemeSummaries(source);
	});
	// --- Section filter state (Consensus / Difference / Uncertainty) ---
	// `is_seed` default matches StatementSection's `excludeHosts = true` default.
	// "Exclude passes" switches the agree% denominator to agrees/(agrees+disagrees),
	// which re-runs the consensus/difference selection — not a row filter.
	let consensusExcludeHosts = $state(true);
	let consensusExcludePasses = $state(false);
	let differencesExcludeHosts = $state(true);
	let differencesExcludePasses = $state(false);

	// Collapse long lists to a preview; "See all" expands in place.
	const COLLAPSED_ROWS = 5;
	let consensusExpanded = $state(false);
	let differencesExpanded = $state(false);
	let showAllThemes = $state(false);

	const consensus = $derived(
		reportData ? getConsensusStatements(reportData, { excludePasses: consensusExcludePasses }) : []
	);
	const differences = $derived(
		reportData
			? getDifferenceStatements(reportData, { excludePasses: differencesExcludePasses })
			: []
	);

	const filterHosts = (list: ReportComment[], excludeHosts: boolean) =>
		excludeHosts ? list.filter((c) => !c.is_seed) : list;

	const consensusFiltered = $derived(filterHosts(consensus, consensusExcludeHosts));
	const differencesFiltered = $derived(filterHosts(differences, differencesExcludeHosts));

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

	const explorerStatements = $derived.by(() => {
		if (!reportData) return [] as ReportComment[];
		let list: ReportComment[] = [...reportData.comments];
		if (explorerExcludeHosts) list = list.filter((c) => !c.is_seed);
		const theme = selectedTheme;
		if (theme) list = list.filter((c) => c.topics?.includes(theme));
		return list.sort((a, b) => totalVotes(b) - totalVotes(a));
	});

	// "Low data quality" = statements with too few votes to be reliable. There's
	// no quality field in the report payload, so this is a tunable heuristic
	// (documented in CONTEXT.md). Low-quality rows are split out of the main
	// Explorer list into a collapsed group.
	const LOW_QUALITY_VOTES = 7;
	let showLowQuality = $state(false);
	const explorerMain = $derived(
		explorerStatements.filter((c) => totalVotes(c) >= LOW_QUALITY_VOTES)
	);
	const explorerLowQuality = $derived(
		explorerStatements.filter((c) => totalVotes(c) < LOW_QUALITY_VOTES)
	);

	function toggleTheme(theme: string) {
		selectedTheme = selectedTheme === theme ? null : theme;
	}

	/**
	 * Persist a picker edit. Optimistic + roll-back on failure. No aux row
	 * means the statement hasn't been backfilled into comhairle yet — the
	 * picker is disabled for those, so this only fires for taggable rows.
	 */
	async function addThemeFor(tid: number, theme: string) {
		const row = auxByTid[tid];
		if (!row || row.themes.includes(theme)) return;
		const prevThemes = row.themes;
		auxByTid = { ...auxByTid, [tid]: { ...row, themes: [...prevThemes, theme] } };
		try {
			const updated = await addStatementAuxTheme(data.api, row.id, theme);
			auxByTid = { ...auxByTid, [tid]: updated };
		} catch (e) {
			console.error('addStatementAuxTheme failed', e);
			auxByTid = { ...auxByTid, [tid]: { ...row, themes: prevThemes } };
		}
	}

	async function removeThemeFor(tid: number, theme: string) {
		const row = auxByTid[tid];
		if (!row || !row.themes.includes(theme)) return;
		const prevThemes = row.themes;
		auxByTid = {
			...auxByTid,
			[tid]: { ...row, themes: prevThemes.filter((t) => t !== theme) }
		};
		try {
			const updated = await removeStatementAuxTheme(data.api, row.id, theme);
			auxByTid = { ...auxByTid, [tid]: updated };
		} catch (e) {
			console.error('removeStatementAuxTheme failed', e);
			auxByTid = { ...auxByTid, [tid]: { ...row, themes: prevThemes } };
		}
	}

	// Per-aux-row in-flight flag so accept/reject buttons can disable mid-call.
	let moderationPending = $state<Record<string, boolean>>({});

	/**
	 * Forward an accept/reject to Polis via /statement_aux/:id/moderate.
	 * Optimistic + roll-back on failure. No-ops for tids without an aux row.
	 */
	async function moderateFor(tid: number, decision: 'accept' | 'reject') {
		const row = auxByTid[tid];
		if (!row || moderationPending[row.id]) return;
		const nextStatus = decision === 'accept' ? 'accepted' : 'rejected';
		if (row.moderation_status === nextStatus) return;

		const prevStatus = row.moderation_status;
		moderationPending = { ...moderationPending, [row.id]: true };
		auxByTid = { ...auxByTid, [tid]: { ...row, moderation_status: nextStatus } };
		try {
			const updated = await moderateStatementAux(data.api, row.id, { decision });
			auxByTid = { ...auxByTid, [tid]: updated };
		} catch (e) {
			console.error('moderateStatementAux failed', e);
			auxByTid = { ...auxByTid, [tid]: { ...row, moderation_status: prevStatus } };
		} finally {
			moderationPending = { ...moderationPending, [row.id]: false };
		}
	}

	function handleDownloadCsv() {
		if (!reportData) return;
		const csv = buildStatementsCsv(reportData, auxByTid);
		const ts = new Date().toISOString().slice(0, 10);
		downloadCsv(`polis-statements-${ts}.csv`, csv);
	}

	function moderationProp(tid: number) {
		const row = auxByTid[tid];
		return {
			status: row?.moderation_status ?? null,
			pending: row ? !!moderationPending[row.id] : false,
			disabled: !row,
			onAccept: () => moderateFor(tid, 'accept'),
			onReject: () => moderateFor(tid, 'reject')
		};
	}
</script>

{#if data.error}
	<div class="text-destructive text-body p-8">Could not load report: {data.error}</div>
{:else if !reportData || !stats}
	<div class="text-muted-foreground text-body p-8">Loading report…</div>
{:else}
	<div class="flex flex-col gap-10 px-8 py-8">
		<!-- ===== Top stats ===== -->
		<div class="flex flex-wrap items-end justify-between gap-4">
			<PollStatRow
				stats={[
					{ label: 'Total Statements', value: stats.totalStatements },
					{ label: 'Themes', value: themes.length },
					{ label: 'Areas of Consensus', value: consensus.length }
				]}
			/>
			<Button variant="outline" size="sm" onclick={handleDownloadCsv}>
				<Download class="size-4" />
				Download CSV
			</Button>
		</div>

		<!-- ===== Themes card ===== -->
		<Card
			class="hover:border-muted-foreground/40 shadow-card rounded-[20px] transition-colors duration-200"
		>
			<header class="flex items-start justify-between gap-4 px-8 pt-8">
				<div>
					<h2 class="font-display text-foreground text-display font-semibold">Themes</h2>
					<p class="text-foreground/70 text-section mt-2 font-medium">
						Click a theme to see all of the statements associated with it.
					</p>
				</div>
				<FilterToggle label="Exclude host statements" bind:checked={themesExcludeHosts} />
			</header>

			<div class="px-8 pt-6 pb-2">
				<div
					class="font-ui text-muted-foreground/60 text-label grid grid-cols-[10rem_3rem_1fr_2.5rem] items-center gap-6 px-2 py-2 font-semibold uppercase"
				>
					<div>Theme</div>
					<div class="text-right">Count</div>
					<div></div>
					<div></div>
				</div>
				{#if themes.length === 0}
					<p class="text-muted-foreground text-caption py-6 italic">
						No themes have been generated yet for this conversation.
					</p>
				{:else}
					{#each showAllThemes ? themes : themes.slice(0, COLLAPSED_ROWS) as t (t.theme)}
						<ThemeBar
							summary={t}
							total={stats.totalStatements}
							onclick={() => toggleTheme(t.theme)}
						/>
					{/each}
					{#if themes.length > COLLAPSED_ROWS}
						<button
							type="button"
							onclick={() => (showAllThemes = !showAllThemes)}
							class="text-foreground/70 hover:text-foreground text-section flex w-full items-center justify-center gap-2 py-4 transition-colors"
						>
							{showAllThemes ? 'Show fewer themes' : `See all ${themes.length} themes`}
							<ChevronDown
								class={`text-destructive size-4 transition-transform ${showAllThemes ? 'rotate-180' : ''}`}
							/>
						</button>
					{/if}
				{/if}
			</div>
		</Card>

		<!-- ===== Areas of Consensus ===== -->
		<StatementSection
			title="Areas of Consensus"
			description="Statements where all groups strongly agreed with the statement (80%+)."
			metricLabel="Min Agree"
			total={consensusFiltered.length}
			collapsedCount={COLLAPSED_ROWS}
			bind:expanded={consensusExpanded}
			bind:excludeHosts={consensusExcludeHosts}
			bind:excludePasses={consensusExcludePasses}
		>
			{#if consensusFiltered.length === 0}
				<p class="text-muted-foreground text-caption px-4 py-6 italic">No consensus statements yet.</p>
			{:else}
				{#each (consensusExpanded ? consensusFiltered : consensusFiltered.slice(0, COLLAPSED_ROWS)) as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="consensus"
						excludePasses={consensusExcludePasses}
						showVerdictPill
						picker={{
							availableThemes,
							disabled: !auxByTid[c.tid],
							onAddTheme: (theme) => addThemeFor(c.tid, theme),
							onRemoveTheme: (theme) => removeThemeFor(c.tid, theme)
						}}
						moderation={moderationProp(c.tid)}
					/>
				{/each}
			{/if}
		</StatementSection>

		<!-- ===== Areas of Difference ===== -->
		<StatementSection
			title="Areas of Difference"
			description="Statements where the spread between the groups was equal to or greater than 30%."
			metricLabel="Difference"
			total={differencesFiltered.length}
			collapsedCount={COLLAPSED_ROWS}
			bind:expanded={differencesExpanded}
			bind:excludeHosts={differencesExcludeHosts}
			bind:excludePasses={differencesExcludePasses}
		>
			{#if differencesFiltered.length === 0}
				<p class="text-muted-foreground text-caption px-4 py-6 italic">No clear differences yet.</p>
			{:else}
				{#each (differencesExpanded ? differencesFiltered : differencesFiltered.slice(0, COLLAPSED_ROWS)) as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="difference"
						excludePasses={differencesExcludePasses}
						showVerdictPill
						picker={{
							availableThemes,
							disabled: !auxByTid[c.tid],
							onAddTheme: (theme) => addThemeFor(c.tid, theme),
							onRemoveTheme: (theme) => removeThemeFor(c.tid, theme)
						}}
						moderation={moderationProp(c.tid)}
					/>
				{/each}
			{/if}
		</StatementSection>

		<!-- Areas of Uncertainty is deferred — see CONTEXT.md. Ships as Consensus +
		     Difference only for now. -->

		<!-- ===== Theme Explorer ===== -->
		<section class="flex flex-col gap-4">
			<h2 class="font-display text-foreground text-display font-semibold">Theme Explorer</h2>

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

			<Card
				class="hover:border-muted-foreground/40 shadow-card rounded-[20px] transition-colors duration-200"
			>
				<div class="flex flex-col">
					<div
						class="font-ui text-muted-foreground/60 text-caption grid grid-cols-[2.5rem_minmax(0,1fr)_4rem_5rem_auto] items-center gap-4 px-5 py-3 font-semibold uppercase"
					>
						<div>#</div>
						<div>Statement</div>
						<div>Author</div>
						<div class="text-center">Count</div>
						<div class="text-right">Agree %</div>
					</div>

					{#if explorerMain.length === 0 && explorerLowQuality.length === 0}
						<p class="text-muted-foreground text-caption px-4 py-6 italic">
							No statements match the current filters.
						</p>
					{:else}
						{#each explorerMain.slice(0, 50) as c, i (c.tid)}
							<StatementRow
								index={i + 1}
								comment={c}
								groups={reportData.groups}
								excludePasses={explorerExcludePasses}
								picker={{
									availableThemes,
									disabled: !auxByTid[c.tid],
									onAddTheme: (theme) => addThemeFor(c.tid, theme),
									onRemoveTheme: (theme) => removeThemeFor(c.tid, theme)
								}}
								moderation={moderationProp(c.tid)}
							/>
						{/each}

						{#if explorerLowQuality.length > 0}
							<button
								type="button"
								onclick={() => (showLowQuality = !showLowQuality)}
								class="text-section flex w-full items-center justify-center gap-2 bg-yellow-400/5 py-5 text-yellow-600 transition-colors hover:bg-yellow-400/10"
							>
								{showLowQuality
									? 'Hide low data quality statements'
									: `See ${explorerLowQuality.length} statements with low data quality`}
								<ChevronDown
									class={`size-4 transition-transform ${showLowQuality ? 'rotate-180' : ''}`}
								/>
							</button>
							{#if showLowQuality}
								{#each explorerLowQuality.slice(0, 50) as c, i (c.tid)}
									<StatementRow
										index={i + 1}
										comment={c}
										groups={reportData.groups}
										excludePasses={explorerExcludePasses}
										picker={{
											availableThemes,
											disabled: !auxByTid[c.tid],
											onAddTheme: (theme) => addThemeFor(c.tid, theme),
											onRemoveTheme: (theme) => removeThemeFor(c.tid, theme)
										}}
										moderation={moderationProp(c.tid)}
									/>
								{/each}
							{/if}
						{/if}
					{/if}
				</div>
			</Card>
		</section>
	</div>
{/if}
