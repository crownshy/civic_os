/**
 * Text that goes between items when a list is rendered as a sentence
 * ("A", "A and B", "A, B, and C"). Used where the items themselves are
 * elements rather than strings, so the list cannot be built with `join`.
 */
export function listSeparator(index: number, total: number): string {
	if (index === total - 1) return '';
	if (total === 2) return ' and ';
	return index === total - 2 ? ', and ' : ', ';
}
