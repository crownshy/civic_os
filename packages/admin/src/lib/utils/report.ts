import type {
	GroupVotePercent,
	PolisReportData,
	ReportComment,
	ReportGroup,
	ThemeControversy,
	ThemeSummary
} from '$lib/types/report';

/** A→Z label for a group_id (0 → "A"). */
export function groupLabel(groupId: number): string {
	return String.fromCharCode(65 + groupId);
}

/** Per-group vote percentages for a single comment. */
export function computeGroupVotePercents(
	comment: ReportComment,
	groups: ReportGroup[]
): GroupVotePercent[] {
	return comment.group_votes.map((gv) => {
		const group = groups.find((g) => g.group_id === gv.group_id);
		const totalMembers = group ? group.total_members : gv.agrees + gv.disagrees + gv.passes;
		const totalVoted = gv.agrees + gv.disagrees + gv.passes;
		const denom = Math.max(totalMembers, totalVoted, 1);
		return {
			group_id: gv.group_id,
			label: groupLabel(gv.group_id),
			totalMembers,
			totalVoted,
			agreed: (gv.agrees / denom) * 100,
			disagreed: (gv.disagrees / denom) * 100,
			passed: (gv.passes / denom) * 100
		};
	});
}

/** Top-line stats across the conversation. */
export function getEngagementStats(data: PolisReportData) {
	const totalParticipants = data.groups.reduce((s, g) => s + g.total_members, 0);
	const totalGroups = data.groups.length;
	const totalStatements = data.comments.length;
	const totalVotes = data.comments.reduce(
		(s, c) => s + c.overall_votes.agrees + c.overall_votes.disagrees + c.overall_votes.passes,
		0
	);
	return { totalParticipants, totalGroups, totalStatements, totalVotes };
}

/** Vote total for a single comment (a + d + p). */
export function totalVotes(c: ReportComment): number {
	return c.overall_votes.agrees + c.overall_votes.disagrees + c.overall_votes.passes;
}

/** Filter helpers shared by the three areas-of-* lists. */
function withMinVotes(comments: ReportComment[], minVotes: number) {
	return comments.filter((c) => totalVotes(c) >= minVotes);
}

/**
 * Areas of consensus: every group agreed strongly with the statement.
 * Default threshold = 80% agree across ALL groups.
 */
export function getConsensusStatements(
	data: PolisReportData,
	{ threshold = 80, minVotes = 5 }: { threshold?: number; minVotes?: number } = {}
): ReportComment[] {
	return withMinVotes(data.comments, minVotes)
		.filter((c) => {
			const pcts = computeGroupVotePercents(c, data.groups);
			if (pcts.length === 0) return false;
			return pcts.every((p) => p.agreed >= threshold);
		})
		.sort(
			(a, b) =>
				(b.group_informed_consensus ?? 0) - (a.group_informed_consensus ?? 0)
		);
}

/**
 * Areas of difference: spread of agree% between groups ≥ threshold (30 by
 * default). Sorted by spread, descending.
 */
export function getDifferenceStatements(
	data: PolisReportData,
	{ threshold = 30, minVotes = 5 }: { threshold?: number; minVotes?: number } = {}
): ReportComment[] {
	return withMinVotes(data.comments, minVotes)
		.map((c) => {
			const pcts = computeGroupVotePercents(c, data.groups).map((p) => p.agreed);
			const spread = pcts.length ? Math.max(...pcts) - Math.min(...pcts) : 0;
			return { c, spread };
		})
		.filter(({ spread }) => spread >= threshold)
		.sort((a, b) => b.spread - a.spread)
		.map(({ c }) => c);
}

/**
 * Areas of uncertainty: pass% significantly higher than the average pass
 * rate across all comments. Default = pass% ≥ avg + stdev (or ≥ 30%).
 */
export function getUncertaintyStatements(
	data: PolisReportData,
	{ minVotes = 5 }: { minVotes?: number } = {}
): ReportComment[] {
	const filtered = withMinVotes(data.comments, minVotes);
	if (filtered.length === 0) return [];

	const passPcts = filtered.map((c) => {
		const t = totalVotes(c);
		return t === 0 ? 0 : (c.overall_votes.passes / t) * 100;
	});
	const avg = passPcts.reduce((s, x) => s + x, 0) / passPcts.length;
	const variance = passPcts.reduce((s, x) => s + (x - avg) ** 2, 0) / passPcts.length;
	const stdev = Math.sqrt(variance);
	const cutoff = Math.max(avg + stdev, 30);

	return filtered
		.map((c, i) => ({ c, pct: passPcts[i] }))
		.filter(({ pct }) => pct >= cutoff)
		.sort((a, b) => b.pct - a.pct)
		.map(({ c }) => c);
}

/** Aggregate topic counts across all comments. */
export function getThemeCounts(data: PolisReportData): { theme: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const c of data.comments) {
		for (const t of c.topics ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
	}
	return [...counts.entries()]
		.map(([theme, count]) => ({ theme, count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Per-statement group-agree spread = max(agree%) − min(agree%) across groups.
 * Returns 0 when the statement has fewer than 2 groups voting.
 */
function statementSpread(comment: ReportComment, groups: ReportGroup[]): number {
	const agreed = computeGroupVotePercents(comment, groups).map((p) => p.agreed);
	if (agreed.length < 2) return 0;
	return Math.max(...agreed) - Math.min(...agreed);
}

/**
 * Controversy classification for a theme. See CONTEXT.md → "Controversy".
 * Average per-statement group-agree spread, bucketed:
 *   <15 → low, 15–30 → moderate, >30 → high.
 */
export function themeControversy(theme: string, data: PolisReportData): ThemeControversy {
	const tagged = data.comments.filter((c) => c.topics?.includes(theme));
	if (tagged.length === 0) return 'low';
	const spreads = tagged.map((c) => statementSpread(c, data.groups));
	const avg = spreads.reduce((s, x) => s + x, 0) / spreads.length;
	if (avg > 30) return 'high';
	if (avg >= 15) return 'moderate';
	return 'low';
}

/** Theme roll-ups for the Themes card: statement count + controversy bucket. */
export function getThemeSummaries(data: PolisReportData): ThemeSummary[] {
	return getThemeCounts(data).map(({ theme, count }) => ({
		theme,
		statementCount: count,
		controversy: themeControversy(theme, data)
	}));
}

/** Overall agree% for one comment (denominator = total votes). */
export function overallAgreePct(c: ReportComment): number {
	const t = totalVotes(c);
	return t === 0 ? 0 : (c.overall_votes.agrees / t) * 100;
}
