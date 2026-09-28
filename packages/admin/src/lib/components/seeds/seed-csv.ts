import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';

/** Header cells a spreadsheet export tends to put above the statements. */
const HEADERS = ['statement', 'statements', 'text'];

/**
 * One statement per line. Strips the wrapping quotes a spreadsheet adds to a cell
 * containing a comma, drops blank lines, and drops a leading header row. Commas
 * inside a line are kept, so a statement never gets split into columns.
 */
export function parseSeedCsv(text: string): string[] {
	const lines = text
		.split(/\r?\n/)
		.map((l) =>
			l
				.replace(/^"(.*)"$/, '$1')
				.replaceAll('""', '"')
				.trim()
		)
		.filter(Boolean);
	if (HEADERS.includes(lines[0]?.toLowerCase())) lines.shift();
	return lines;
}

/** Two statements that differ only in case or spacing read as the same one. */
const sameText = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

function which(positions: number[], total: number): string {
	if (total === 1) return 'This statement is';
	const list = positions.join(', ');
	return positions.length === 1 ? `Statement ${list} is` : `Statements ${list} are`;
}

/**
 * Why these seeds cannot be posted, or null. Checked before the first post:
 * Polis has no batch create, so a problem found midway leaves part of a CSV
 * live. Positions count statements, not file lines, since blanks and a header
 * row are dropped first.
 */
export function seedProblem(
	texts: readonly string[],
	existing: readonly string[] = []
): string | null {
	const long = texts.flatMap((text, i) => (text.length > TEXT_LIMITS.statement ? [i + 1] : []));
	if (long.length) {
		return `${which(long, texts.length)} over ${TEXT_LIMITS.statement} characters. Shorten and try again.`;
	}

	const seen = new Set(existing.map(sameText));
	const repeats: number[] = [];
	texts.forEach((text, i) => {
		const key = sameText(text);
		if (seen.has(key)) repeats.push(i + 1);
		seen.add(key);
	});
	if (repeats.length) {
		return `${which(repeats, texts.length)} already in the poll or repeated above. Remove and try again.`;
	}

	return null;
}
