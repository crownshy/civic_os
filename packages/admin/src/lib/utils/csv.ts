export type CsvParseResult = {
	/** One array of cell strings per row, blank rows already dropped. */
	rows: string[][];
	/**
	 * Anything the parser objected to, phrased for a person. Non-fatal: `rows` still holds the
	 * parser's best reading. An unterminated quote is the one that matters, because it swallows
	 * the rest of the file into a single cell without otherwise looking wrong.
	 */
	problems: string[];
	/** The delimiter the parser settled on, so a caller can put a split row back together. */
	delimiter: string;
};

/**
 * Parses CSV text into rows of string cells (RFC 4180: quoted fields may contain the delimiter,
 * newlines, and "" escaped quotes).
 *
 * The delimiter is sniffed, not assumed, so a file exported by a spreadsheet set to a
 * semicolon-separated locale reads correctly. A byte order mark is stripped, and rows holding
 * nothing but separators and whitespace are dropped, which is what a spreadsheet's trailing
 * empty columns look like.
 *
 * papaparse is loaded on demand, so only the screens that parse a file pay for it.
 */
export async function parseCsvRows(text: string): Promise<CsvParseResult> {
	const { default: Papa } = await import('papaparse');
	const parsed = Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' });

	return {
		rows: parsed.data,
		problems: parsed.errors
			// A file with one column per row has no delimiter to find, which is normal here and
			// not worth reporting. Every other complaint is.
			.filter((error) => error.code !== 'UndetectableDelimiter')
			.map((error) =>
				error.row === undefined ? error.message : `${error.message} (row ${error.row + 1})`
			),
		delimiter: parsed.meta.delimiter
	};
}
