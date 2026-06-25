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
	import Card from '@civicos/shared/ui/Card.svelte';

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
	const consensus = $derived(reportData ? getConsensusStatements(reportData) : []);
	const differences = $derived(reportData ? getDifferenceStatements(reportData) : []);
	const uncertain = $derived(reportData ? getUncertaintyStatements(reportData) : []);

	// --- Section filter state (Consensus / Difference / Uncertainty) ---
	// `is_seed` default matches StatementSection's `excludeHosts = true` default.
	let consensusExcludeHosts = $state(true);
	let consensusExcludePasses = $state(false);
	let differencesExcludeHosts = $state(true);
	let differencesExcludePasses = $state(false);
	let uncertainExcludeHosts = $state(true);
	let uncertainExcludePasses = $state(false);

	function applySectionFilters(
		list: ReportComment[],
		excludeHosts: boolean,
		excludePasses: boolean
	): ReportComment[] {
		let r = list;
		if (excludeHosts) r = r.filter((c) => !c.is_seed);
		if (excludePasses) {
			r = r.filter((c) => {
				const t = totalVotes(c);
				return t > 0 && c.overall_votes.passes / t < 0.4;
			});
		}
		return r;
	}

	const consensusFiltered = $derived(
		applySectionFilters(consensus, consensusExcludeHosts, consensusExcludePasses)
	);
	const differencesFiltered = $derived(
		applySectionFilters(differences, differencesExcludeHosts, differencesExcludePasses)
	);
	const uncertainFiltered = $derived(
		applySectionFilters(uncertain, uncertainExcludeHosts, uncertainExcludePasses)
	);

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
	async function addThemeFor(tid: number, theme: string) {
		const row = auxByTid[tid];
		if (!row || row.themes.includes(theme)) return;
		const prevThemes = row.themes;
		auxByTid = { ...auxByTid, [tid]: { ...row, themes: [...prevThemes, theme] } };
		try {
			const updated = await addStatementAuxTheme(row.id, theme);
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
			const updated = await removeStatementAuxTheme(row.id, theme);
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
			const updated = await moderateStatementAux(row.id, { decision });
			auxByTid = { ...auxByTid, [tid]: updated };
		} catch (e) {
			console.error('moderateStatementAux failed', e);
			auxByTid = { ...auxByTid, [tid]: { ...row, moderation_status: prevStatus } };
		} finally {
			moderationPending = { ...moderationPending, [row.id]: false };
		}
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
		<PollStatRow
			stats={[
				{ label: 'Total Statements', value: stats.totalStatements },
				{ label: 'Themes', value: themes.length },
				{ label: 'Areas of Consensus', value: consensus.length }
			]}
		/>

		<!-- ===== Themes card ===== -->
		<Card
			class="hover:border-muted-foreground/40 bg-card shadow-card transition-colors duration-200"
		>
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
		</Card>

		<!-- ===== Areas of Consensus ===== -->
		<StatementSection
			title="Areas of Consensus"
			description="Statements where all groups strongly agreed with the statement (80%+)."
			bind:excludeHosts={consensusExcludeHosts}
			bind:excludePasses={consensusExcludePasses}
		>
			{#if consensusFiltered.length === 0}
				<p class="text-muted-foreground text-caption px-4 py-6 italic">No consensus statements yet.</p>
			{:else}
				{#each consensusFiltered as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="consensus"
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
			bind:excludeHosts={differencesExcludeHosts}
			bind:excludePasses={differencesExcludePasses}
		>
			{#if differencesFiltered.length === 0}
				<p class="text-muted-foreground text-caption px-4 py-6 italic">No clear differences yet.</p>
			{:else}
				{#each differencesFiltered as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="difference"
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

		<!-- ===== Areas of Uncertainty ===== -->
		<StatementSection
			title="Areas of Uncertainty"
			description="Statements where the percentage of people who passed was significantly higher than average."
			bind:excludeHosts={uncertainExcludeHosts}
			bind:excludePasses={uncertainExcludePasses}
		>
			{#if uncertainFiltered.length === 0}
				<p class="text-muted-foreground text-caption px-4 py-6 italic">
					No statements of unusual uncertainty yet.
				</p>
			{:else}
				{#each uncertainFiltered as c, i (c.tid)}
					<StatementRow
						index={i + 1}
						comment={c}
						groups={reportData.groups}
						variant="uncertainty"
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

			<Card
				class="hover:border-muted-foreground/40 shadow-card transition-colors duration-200"
			>
				<div class="flex flex-col">
					<div
						class="text-muted-foreground/60 text-label grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(10rem,14rem)_2.5rem_auto_auto] items-center gap-4 px-4 py-2 font-semibold uppercase"
					>
						<div>#</div>
						<div>Statement</div>
						<div>Theme</div>
						<div class="text-right">Count</div>
						<div>Groups</div>
						<div class="pr-4">Action</div>
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
									onAddTheme: (theme) => addThemeFor(c.tid, theme),
									onRemoveTheme: (theme) => removeThemeFor(c.tid, theme)
								}}
								moderation={moderationProp(c.tid)}
							/>
						{/each}
					{/if}
				</div>
			</Card>
		</section>
	</div>
{/if}
