<script lang="ts">
	import type { PageProps } from './$types';
	import type { ReportComment, PolisReportData, ThemeSummary } from '$lib/types/report';
	import type { PolisStatementAux } from '$lib/types/aux';
	import { addStatementAuxTheme, removeStatementAuxTheme } from '$lib/api/aux';
	import {
		getEngagementStats,
		getConsensusStatements,
		getDifferenceStatements,
		themeControversy,
		classifyStatement,
		isLowQuality,
		totalVotes
	} from '$lib/utils/report';
	import { buildStatementsCsv, downloadCsv } from '$lib/utils/report-csv';
	import StatementRow from '$lib/components/insights/StatementRow.svelte';
	import StatementSection from '$lib/components/insights/StatementSection.svelte';
	import ThemeBar from '$lib/components/insights/ThemeBar.svelte';
	import ThemeChip from '$lib/components/insights/ThemeChip.svelte';
	import PollStatRow from '$lib/components/PollStatRow.svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Download, ChevronDown } from '@lucide/svelte';
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';

	const ALL_STATEMENTS_ID = 'all-statements';

	let { data }: PageProps = $props();

	// Local mutable aux map so picker edits re-render without a refetch.
	// Re-seeded on every load (e.g. when slug changes).
	let auxByTid = $state<Record<number, PolisStatementAux>>(data.auxByTid);
	$effect(() => {
		auxByTid = data.auxByTid;
	});

	/**
	 * Overlay aux.themes onto each comment so the existing utils (which read
	 * `comment.topics`) get aux-sourced themes for free. Themes are human-authored
	 * today and live only in aux; Polis carries none, so `comment.topics` is empty
	 * until a future T3C source populates it (see CONTEXT.md → "Theme"). Comments
	 * with no aux row keep that empty `topics` and simply contribute no themes.
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
	// Theme roll-up over ALL tagged statements (aux), not just the Polis report
	// set. Statements outside the report — e.g. pending/rejected ones still shown
	// in Moderation — carry human-authored themes we want surfaced, so the card
	// matches what the Moderation table shows. Controversy needs vote data (which
	// only the report carries), so themes on non-report statements fall back to
	// 'low' — not surfaced today anyway (see ThemeBar).
	const themes = $derived.by<ThemeSummary[]>(() => {
		const counts = new Map<string, number>();
		for (const row of Object.values(auxByTid)) {
			for (const t of row.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
		}
		return [...counts.entries()]
			.map(([theme, statementCount]) => ({
				theme,
				statementCount,
				controversy: reportData ? themeControversy(theme, reportData) : ('low' as const)
			}))
			.sort((a, b) => b.statementCount - a.statementCount);
	});
	// Bars rank against the biggest theme (themes is sorted count-desc), not the
	// statement total — see ThemeBar.
	const maxThemeCount = $derived(themes[0]?.statementCount ?? 0);
	// --- Section filter state (Consensus / Difference / Uncertainty) ---
	// Every table defaults to "Include host statements" (excludeHosts = false), matching
	// the Agree% "Include passes" default — all statements shown until the user filters.
	// "Exclude passes" switches the agree% denominator to agrees/(agrees+disagrees),
	// which re-runs the consensus/difference selection — not a row filter.
	let consensusExcludeHosts = $state(false);
	let consensusExcludePasses = $state(false);
	let differencesExcludeHosts = $state(false);
	let differencesExcludePasses = $state(false);

	// Collapse long lists to a preview; "See all" expands in place.
	const COLLAPSED_ROWS = 5;
	let consensusExpanded = $state(false);
	let differencesExpanded = $state(false);
	let showAllThemes = $state(false);

	// Low-quality rows (any group < 10 votes) are hidden by default in every
	// table but stay in the counts; each table reveals its own set. See CONTEXT.md.
	let consensusShowLow = $state(false);
	let differencesShowLow = $state(false);

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

	// Split each list into trustworthy rows (shown) and low-quality rows (behind a
	// reveal). Both halves stay counted in the section total.
	const consensusMain = $derived(consensusFiltered.filter((c) => !isLowQuality(c)));
	const consensusLow = $derived(consensusFiltered.filter((c) => isLowQuality(c)));
	const differencesMain = $derived(differencesFiltered.filter((c) => !isLowQuality(c)));
	const differencesLow = $derived(differencesFiltered.filter((c) => isLowQuality(c)));

	/** All themes used anywhere on this conversation — powers the picker dropdown. */
	const availableThemes = $derived.by(() => {
		const set = new Set<string>();
		for (const row of Object.values(auxByTid)) {
			for (const t of row.themes) set.add(t);
		}
		return [...set].sort();
	});

	// --- All Statements: theme filter state ---
	// Multi-select theme filter (OR/union). Seeded from ?theme=a,b so the view is
	// deep-linkable/shareable.
	let selectedThemes = $state<string[]>(
		(page.url.searchParams.get('theme') ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	);
	let explorerExcludePasses = $state(false);
	let explorerExcludeHosts = $state(false);

	const explorerStatements = $derived.by(() => {
		if (!reportData) return [] as ReportComment[];
		let list: ReportComment[] = [...reportData.comments];
		if (explorerExcludeHosts) list = list.filter((c) => !c.is_seed);
		// OR: keep statements matching ANY selected theme.
		if (selectedThemes.length > 0) {
			list = list.filter((c) => selectedThemes.some((t) => c.topics?.includes(t)));
		}
		return list.sort((a, b) => totalVotes(b) - totalVotes(a));
	});

	// "All Statements" shows everything by default (it's last, so length doesn't
	// disrupt) but the reveal is still reversible. Low-quality rows split out as
	// in the other tables. See CONTEXT.md → "Low data quality".
	let explorerExpanded = $state(true);
	let showLowQuality = $state(false);
	const explorerMain = $derived(explorerStatements.filter((c) => !isLowQuality(c)));
	const explorerLowQuality = $derived(explorerStatements.filter((c) => isLowQuality(c)));
	const explorerTotal = $derived(explorerMain.length + explorerLowQuality.length);

	/** Set the theme filter and mirror it into ?theme=a,b (shallow — no history spam). */
	function setThemes(next: string[]) {
		selectedThemes = next;
		const url = new URL(page.url);
		if (next.length) url.searchParams.set('theme', next.join(','));
		else url.searchParams.delete('theme');
		replaceState(url, {});
	}

	/** Chip bar: add/remove one theme from the OR-combined filter. */
	function toggleTheme(theme: string) {
		setThemes(
			selectedThemes.includes(theme)
				? selectedThemes.filter((t) => t !== theme)
				: [...selectedThemes, theme]
		);
	}

	/** Themes card: replace the filter with just this theme and scroll to the table. */
	async function focusTheme(theme: string) {
		setThemes([theme]);
		await tick();
		document.getElementById(ALL_STATEMENTS_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	// Arriving via a ?theme= deep-link: jump to the (already filtered) table.
	onMount(() => {
		if (selectedThemes.length) {
			document.getElementById(ALL_STATEMENTS_ID)?.scrollIntoView({ block: 'start' });
		}
	});

	/** Shared theme-picker wiring for a row (disabled until the aux row exists). */
	function pickerFor(tid: number) {
		return {
			availableThemes,
			disabled: !auxByTid[tid],
			onAddTheme: (theme: string) => addThemeFor(tid, theme),
			onRemoveTheme: (theme: string) => removeThemeFor(tid, theme)
		};
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

	function handleDownloadCsv() {
		if (!reportData) return;
		const csv = buildStatementsCsv(reportData, auxByTid);
		const ts = new Date().toISOString().slice(0, 10);
		downloadCsv(`polis-statements-${ts}.csv`, csv);
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
			<Button onclick={handleDownloadCsv}>
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
			</header>

			<div class="px-8 pt-6 pb-2">
				<div
					class="font-ui text-foreground text-caption grid grid-cols-[10rem_3rem_1fr_2.5rem] items-center gap-6 px-2 py-2 font-semibold uppercase"
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
							barMax={maxThemeCount}
							onclick={() => focusTheme(t.theme)}
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
			count={consensusFiltered.length}
			countAccent="consensus"
			description="with greater than 80% agreement across all groups."
			metricLabel="Min Agree"
			groupCount={reportData.groups.length}
			total={consensusMain.length}
			collapsedCount={COLLAPSED_ROWS}
			lowQualityCount={consensusLow.length}
			bind:expanded={consensusExpanded}
			bind:showLowQuality={consensusShowLow}
			bind:excludeHosts={consensusExcludeHosts}
			bind:excludePasses={consensusExcludePasses}
		>
			{#if consensusMain.length === 0}
				<p class="text-muted-foreground text-caption px-4 py-6 italic">No consensus statements yet.</p>
			{:else}
				{#each (consensusExpanded ? consensusMain : consensusMain.slice(0, COLLAPSED_ROWS)) as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="consensus"
						excludePasses={consensusExcludePasses}
						picker={pickerFor(c.tid)}
					/>
				{/each}
			{/if}

			{#snippet lowQuality()}
				{#each consensusLow as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="consensus"
						excludePasses={consensusExcludePasses}
						picker={pickerFor(c.tid)}
					/>
				{/each}
			{/snippet}
		</StatementSection>

		<!-- ===== Areas of Difference ===== -->
		<StatementSection
			title="Areas of Difference"
			count={differencesFiltered.length}
			countAccent="difference"
			description="with greater than 30% difference across the groups."
			metricLabel="Difference"
			groupCount={reportData.groups.length}
			total={differencesMain.length}
			collapsedCount={COLLAPSED_ROWS}
			lowQualityCount={differencesLow.length}
			bind:expanded={differencesExpanded}
			bind:showLowQuality={differencesShowLow}
			bind:excludeHosts={differencesExcludeHosts}
			bind:excludePasses={differencesExcludePasses}
		>
			{#if differencesMain.length === 0}
				<p class="text-muted-foreground text-caption px-4 py-6 italic">No clear differences yet.</p>
			{:else}
				{#each (differencesExpanded ? differencesMain : differencesMain.slice(0, COLLAPSED_ROWS)) as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="difference"
						excludePasses={differencesExcludePasses}
						picker={pickerFor(c.tid)}
					/>
				{/each}
			{/if}

			{#snippet lowQuality()}
				{#each differencesLow as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="difference"
						excludePasses={differencesExcludePasses}
						picker={pickerFor(c.tid)}
					/>
				{/each}
			{/snippet}
		</StatementSection>

		<!-- Areas of Uncertainty is deferred — see CONTEXT.md. Ships as Consensus +
		     Difference only for now. -->

		<!-- ===== All Statements ===== -->
		<StatementSection
			id={ALL_STATEMENTS_ID}
			title="All Statements"
			count={explorerTotal}
			countAccent="all"
			description="in total. Use labels below to filter by theme."
			metricLabel="Count"
			groupCount={reportData.groups.length}
			total={explorerMain.length}
			collapsedCount={COLLAPSED_ROWS}
			lowQualityCount={explorerLowQuality.length}
			bind:expanded={explorerExpanded}
			bind:showLowQuality
			bind:excludeHosts={explorerExcludeHosts}
			bind:excludePasses={explorerExcludePasses}
		>
			{#snippet headerAction()}
				<Button variant="default" size="sm" onclick={handleDownloadCsv}>
					<Download class="size-4" />
					Download CSV
				</Button>
			{/snippet}

			{#snippet toolbar()}
				<div class="flex flex-wrap gap-2">
					{#each themes as t (t.theme)}
						<ThemeChip
							label={t.theme}
							variant="brand"
							selected={selectedThemes.includes(t.theme)}
							onclick={() => toggleTheme(t.theme)}
						/>
					{/each}
					{#if themes.length === 0}
						<span class="text-muted-foreground text-caption italic">No themes yet.</span>
					{/if}
				</div>
			{/snippet}

			{#if explorerMain.length === 0}
				<p class="text-muted-foreground text-caption px-4 py-6 italic">
					No statements match the current filters.
				</p>
			{:else}
				{#each (explorerExpanded ? explorerMain : explorerMain.slice(0, COLLAPSED_ROWS)) as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant={classifyStatement(c, reportData.groups, { excludePasses: explorerExcludePasses })}
						excludePasses={explorerExcludePasses}
						picker={pickerFor(c.tid)}
					/>
				{/each}
			{/if}

			{#snippet lowQuality()}
				{#each explorerLowQuality as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant={classifyStatement(c, reportData.groups, { excludePasses: explorerExcludePasses })}
						excludePasses={explorerExcludePasses}
						picker={pickerFor(c.tid)}
					/>
				{/each}
			{/snippet}
		</StatementSection>
	</div>
{/if}
