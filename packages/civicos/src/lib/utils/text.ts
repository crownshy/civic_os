/** The first value that is present and not just whitespace, or `''`. */
export function firstNonEmpty(...values: (string | null | undefined)[]): string {
	for (const value of values) {
		if (value && value.trim() !== '') return value;
	}
	return '';
}
