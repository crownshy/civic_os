import { TEXT_LIMITS, toOneLine } from '@civicos/shared/data/text-limits';
import { parseCsvRows } from '$lib/utils/csv';

/**
 * Headings that name the statement column, lowercased. Used to spot a header row in a
 * one-column file and to pick the default column in a wider one. `statement_text` is what
 * the statements export writes, so a re-imported export needs no choosing.
 */
const STATEMENT_HEADINGS = [
	'statement',
	'statements',
	'statement_text',
	'text',
	'comment',
	'comment_body',
	'comment-body'
];

/** A column the Host can take the statements from, when the file has more than one. */
export type SeedColumn = {
	/** Position of the column in each row. */
	index: number;
	/** The column's heading from the first row, or "Column N" when that cell is blank. */
	heading: string;
};

export type ParsedSeedCsv = {
	/** One statement per surviving row, trimmed and on one line, in file order. */
	statements: string[];
	/** The heading that was skipped, or null when the file had no header row. */
	header: string | null;
	/** Parser complaints worth showing above the preview. Empty when the file is clean. */
	problems: string[];
	/** Every column with content in it, when there is more than one. Empty otherwise. */
	columns: SeedColumn[];
	/** Index of the column the statements came from, or null for a one-column file. */
	column: number | null;
};

/** Two statements that differ only in case or spacing read as the same one. */
const sameText = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

function isStatementHeading(value: string): boolean {
	return STATEMENT_HEADINGS.includes(value.trim().toLowerCase());
}

/**
 * Rejoins the cells from the first to the last with content, trimmed. The untrimmed cells are
 * joined so the space after a comma survives.
 */
function joinContent(cells: string[], delimiter: string): string {
	const first = cells.findIndex((cell) => cell.trim());
	if (first === -1) return '';
	const last = cells.findLastIndex((cell) => cell.trim());
	return cells
		.slice(first, last + 1)
		.join(delimiter)
		.trim();
}

/**
 * Reads the statements out of a seed statement CSV. Ported from comhairle's importer.
 *
 * A one-column file gives one statement per row. A spreadsheet export arrives padded to the
 * widest row, so a statement reads `text,,,,,,` and a blank line `,,,,,,`: the empty cells
 * around the statement are dropped, and whatever sits between the first and last cell with
 * content is put back together, so a hand-written line with an unquoted comma stays one
 * statement.
 *
 * A file is read as multi-column only when it is rectangular (a spreadsheet export always
 * is) and more than one column has content. Then the first row is the headings, and the
 * statements come from `column` when given, otherwise the first whose heading names
 * statements, otherwise the first with content.
 *
 * A line break inside a quoted cell becomes a space, because a statement is one line (#465).
 *
 * @param text the raw file contents, byte order mark and all
 * @param column index of the column to read, from a previous parse's `columns`
 */
export async function parseSeedCsv(text: string, column?: number): Promise<ParsedSeedCsv> {
	const parsed = await parseCsvRows(text);
	// Untrimmed copies are kept for `joinContent`, so the space after a comma survives.
	const raw = parsed.rows.map((cells) => cells.map(toOneLine));
	const rows = raw.map((cells) => cells.map((cell) => cell.trim()));
	const { problems } = parsed;

	const width = Math.max(0, ...rows.map((cells) => cells.length));
	const populated = Array.from({ length: width }, (_, index) => index).filter((index) =>
		rows.some((cells) => Boolean(cells[index]))
	);
	const rectangular = rows.every((cells) => cells.length === width);

	if (rows.length > 1 && rectangular && populated.length > 1) {
		const headings = rows[0];
		const columns = populated.map((index) => ({
			index,
			heading: headings[index] || `Column ${index + 1}`
		}));
		const chosen =
			column !== undefined && populated.includes(column)
				? column
				: (columns.find((candidate) => isStatementHeading(candidate.heading)) ?? columns[0]).index;

		return {
			statements: rows
				.slice(1)
				.map((cells) => cells[chosen] ?? '')
				.filter(Boolean),
			header: headings[chosen] || null,
			problems,
			columns,
			column: chosen
		};
	}

	const values = raw.map((cells) => joinContent(cells, parsed.delimiter)).filter(Boolean);
	const first = values[0] ?? '';
	const header = isStatementHeading(first) ? first : null;

	return {
		statements: header === null ? values : values.slice(1),
		header,
		problems,
		columns: [],
		column: null
	};
}

/** Why a previewed statement needs a second look. */
export type SeedStatementIssue = 'empty' | 'too-long' | 'duplicate-in-file' | 'duplicate-in-step';

/**
 * Whether an issue stops the batch from posting. An empty line is only skipped. A repeat
 * blocks because Polis refuses a statement it already has, and a batch that hits one stops
 * halfway, with everything before it already live.
 */
export function blocksPosting(issue: SeedStatementIssue | null): boolean {
	return issue !== null && issue !== 'empty';
}

/**
 * Flags each statement worth a second look, in the same order. Comparison ignores case and
 * collapses whitespace, so near-misses surface alongside exact repeats. The first copy of a
 * repeated statement is left unflagged, so removing every flagged row still leaves one of each.
 *
 * @param statements the parsed statements, as currently edited
 * @param existing every statement already in the poll, rejected ones included
 */
export function findSeedIssues(
	statements: readonly string[],
	existing: readonly string[]
): (SeedStatementIssue | null)[] {
	const inPoll = new Set(existing.map(sameText));
	const seen = new Set<string>();

	return statements.map((statement) => {
		const key = sameText(statement);
		if (!key) return 'empty';
		if (statement.trim().length > TEXT_LIMITS.statement) return 'too-long';
		if (seen.has(key)) return 'duplicate-in-file';
		seen.add(key);
		if (inPoll.has(key)) return 'duplicate-in-step';
		return null;
	});
}

function which(positions: number[], total: number): string {
	if (total === 1) return 'This statement is';
	const list = positions.join(', ');
	return positions.length === 1 ? `Statement ${list} is` : `Statements ${list} are`;
}

/**
 * Why a hand-written seed cannot be posted, or null. A CSV goes through the preview and
 * `findSeedIssues` instead, where the Host can fix each line before anything is posted.
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
