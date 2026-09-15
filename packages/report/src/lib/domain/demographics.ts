import type { DemographicCategory, DemographicRow, Demographics } from './types';

/**
 * A category's rows, poll order first. A group nobody in the poll belongs to
 * has no poll row, but its population share is exactly what shows it is
 * missing, so it is listed after them at 0%.
 */
export function demographicRows(
	category: DemographicCategory,
	actual: Demographics['actual']
): DemographicRow[] {
	const population = actual[category.key] ?? {};
	const polled = new Set(category.breakdown.map((row) => row.label));
	const absent = Object.keys(population)
		.filter((label) => !polled.has(label))
		.map((label) => ({ label, pct: 0 }));
	return [...category.breakdown, ...absent].map((row) => ({
		...row,
		actual: population[row.label]
	}));
}
