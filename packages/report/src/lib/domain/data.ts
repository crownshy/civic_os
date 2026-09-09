/**
 * Deriving the report's views from its raw records.
 *
 * Every function here takes its data explicitly rather than closing over a
 * module-level dataset, matching `packages/admin/src/lib/utils/report.ts` and
 * keeping the whole file testable with small fixtures.
 */

import type {
	Group,
	GroupWithTally,
	Insight,
	ReportRecord,
	Theme,
	ThemeView,
	Vote
} from './types';

/**
 * A theme *is* the records carrying any of its tags: membership is derived,
 * not stored, so a statement spanning two subjects belongs to both themes, and
 * one carrying no claimed tag belongs to none and drops out of the report.
 */
export function recordsForTheme(records: readonly ReportRecord[], theme: Theme): ReportRecord[] {
	return records.filter((record) => record.tags.some((tag) => theme.tags.includes(tag)));
}

export function statementsForTheme(records: readonly ReportRecord[], theme: Theme): ReportRecord[] {
	return recordsForTheme(records, theme).filter((record) => record.kind === 'poll');
}

export function quotesForTheme(records: readonly ReportRecord[], theme: Theme): ReportRecord[] {
	return recordsForTheme(records, theme).filter((record) => record.kind === 'quote');
}

/**
 * Display order for a theme's statements: broadest agreement first, and among
 * equals the one more people voted on. Records without a vote sort last rather
 * than throwing; quotes never reach here, but a malformed poll record might.
 */
export function byStatementRank(a: ReportRecord, b: ReportRecord): number {
	const minAgree = (r: ReportRecord) => r.vote?.minAgree ?? -1;
	const total = (r: ReportRecord) => r.vote?.total ?? -1;
	return minAgree(b) - minAgree(a) || total(b) - total(a);
}

export function indexById(records: readonly ReportRecord[]): Map<string, ReportRecord> {
	return new Map(records.map((record) => [record.id, record]));
}

/**
 * A theme's statements in display order, plus the records its insights cite.
 *
 * An insight may cite a quote, or a statement from another theme; those are
 * appended after the ranked statements so the carousel can show them, without
 * displacing anything or appearing twice.
 */
export function buildThemeView(
	records: readonly ReportRecord[],
	theme: Theme,
	insights: readonly Insight[] = []
): ThemeView {
	const statements = statementsForTheme(records, theme).sort(byStatementRank);
	const byId = indexById(records);
	const seen = new Set(statements.map((record) => record.id));
	const items = statements.slice();

	for (const insight of insights) {
		for (const id of insight.ids) {
			const record = byId.get(id);
			if (record && !seen.has(id)) {
				seen.add(id);
				items.push(record);
			}
		}
	}

	return Object.freeze({
		statements: Object.freeze(statements),
		items: Object.freeze(items)
	});
}

/** Each declared group with this statement's tally merged on, in `groups` order. */
export function groupsOf(groups: readonly Group[], vote: Vote): GroupWithTally[] {
	return groups.map((group) => ({ ...group, ...vote.groups[group.key] }));
}
