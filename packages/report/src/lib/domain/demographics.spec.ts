import { describe, expect, it } from 'vitest';
import { demographicRows } from './demographics';
import type { DemographicCategory } from './types';

const ethnicity: DemographicCategory = {
	key: 'ethnicity',
	label: 'Race / Ethnicity',
	answered: 10,
	breakdown: [
		{ label: 'White or Caucasian', pct: 90 },
		{ label: 'Multiracial', pct: 10 }
	]
};

describe('demographicRows', () => {
	it('pairs each poll row with its population share', () => {
		const rows = demographicRows(ethnicity, {
			ethnicity: { 'White or Caucasian': 78, Multiracial: 5 }
		});
		expect(rows).toEqual([
			{ label: 'White or Caucasian', pct: 90, actual: 78 },
			{ label: 'Multiracial', pct: 10, actual: 5 }
		]);
	});

	it('lists a population group the poll has nobody from at 0%, after the poll rows', () => {
		const rows = demographicRows(ethnicity, {
			ethnicity: { 'Native American': 4, 'White or Caucasian': 78, Multiracial: 5 }
		});
		expect(rows.map((row) => row.label)).toEqual([
			'White or Caucasian',
			'Multiracial',
			'Native American'
		]);
		expect(rows[2]).toEqual({ label: 'Native American', pct: 0, actual: 4 });
	});

	it('leaves the population share undefined when the category has none', () => {
		expect(demographicRows(ethnicity, {})[0].actual).toBeUndefined();
	});
});
