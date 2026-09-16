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
