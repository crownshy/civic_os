import type { PolisReportData, ReportComment } from '$lib/types/report';
import type { PolisStatementAux } from '$lib/types/aux';
import { consensusDirection, groupLabel, totalVotes } from './report';

/** Wrap a value for CSV: quote, double internal quotes, normalize newlines. */
function csvField(value: unknown): string {
	if (value === null || value === undefined) return '';
	const s = String(value).replace(/\r\n|\r/g, '\n');
	return `"${s.replace(/"/g, '""')}"`;
}

/** Sorted union of every theme appearing on any statement in the report. */
function collectThemes(comments: ReportComment[]): string[] {
	const set = new Set<string>();
	for (const c of comments) {
		for (const t of c.topics ?? []) set.add(t);
	}
	return [...set].sort();
}

/**
 * Build a CSV of all statements in the report, one row per comment.
 *
 * Reuses `consensusDirection`, `totalVotes`, and `groupLabel` from
 * `utils/report.ts` so what shows up in the UI matches what's exported.
 *
 * `auxByTid` supplies `user_id`, `moderation_status`, and `is_seed` —
 * fields the polis report payload doesn't carry directly. Rows without an
 * aux entry get empty strings for those columns.
 *
 * The `comments[].topics` array on the passed-in `data` should already be
 * the user-visible themes (i.e. aux-overlaid in the page) so the export
 * matches what the user sees.
 */
export function buildStatementsCsv(
	data: PolisReportData,
	auxByTid: Record<number, PolisStatementAux>
): string {
	const themes = collectThemes(data.comments);
	const groupIds = data.groups.map((g) => g.group_id).sort((a, b) => a - b);

	const header: string[] = [
		'user_id',
		'agrees',
		'disagrees',
		'passes',
		'total_votes',
		...themes.map((t) => `theme: ${t}`),
		'consensus',
		'statement_text'
	];
	for (const gid of groupIds) {
		const label = groupLabel(gid);
		header.push(`group_${label}_agrees`, `group_${label}_disagrees`, `group_${label}_passes`);
	}
	header.push('moderation_status', 'is_seed');

	const lines = [header.map(csvField).join(',')];

	for (const c of data.comments) {
		const aux = auxByTid[c.tid];
		const dir = consensusDirection(c, data.groups);
		const consensus = dir === '+' ? 'True +' : dir === '−' ? 'True −' : '';
		const topicSet = new Set(c.topics ?? []);

		const row: unknown[] = [
			aux?.user_id ?? '',
			c.overall_votes.agrees,
			c.overall_votes.disagrees,
			c.overall_votes.passes,
			totalVotes(c),
			...themes.map((t) => (topicSet.has(t) ? 'true' : 'false')),
			consensus,
			c.text
		];

		for (const gid of groupIds) {
			const gv = c.group_votes.find((v) => v.group_id === gid);
			row.push(gv?.agrees ?? 0, gv?.disagrees ?? 0, gv?.passes ?? 0);
		}

		row.push(aux?.moderation_status ?? '', (c.is_seed ?? aux?.is_seed ?? false) ? 'true' : 'false');

		lines.push(row.map(csvField).join(','));
	}

	return lines.join('\n');
}

/** Trigger a browser download for the given CSV text. */
export function downloadCsv(filename: string, csv: string): void {
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
