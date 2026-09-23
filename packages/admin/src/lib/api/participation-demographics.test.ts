import { describe, expect, it } from 'vitest';
import { readParticipationDemographics } from '@civicos/shared/data/demographics';

/**
 * The generated `DemographicReport` declares only `categories` and
 * `totalParticipants`, so every breakdown the page renders arrives through
 * `.passthrough()` as `unknown`. These pin the shape the backend actually
 * sends, and the behaviour when it sends something else.
 */
describe('readParticipationDemographics', () => {
	const report = {
		totalParticipants: 42,
		ageRanges: [{ category: 'ageRanges', value: '25-34', count: 7 }],
		ethnicity: [{ category: 'ethnicity', value: null, count: 3 }],
		gender: [{ category: 'gender', value: 'woman', count: 12 }],
		politicalParty: [{ category: 'politicalParty', value: 'independent', count: 5 }],
		zipcodeCounts: { '84101': 4, '84102': 1 }
	};

	it('keeps every breakdown the report carries', () => {
		const result = readParticipationDemographics(report);

		expect(result.totalParticipants).toBe(42);
		expect(result.ageRanges).toEqual([{ category: 'ageRanges', value: '25-34', count: 7 }]);
		expect(result.gender).toEqual([{ category: 'gender', value: 'woman', count: 12 }]);
		expect(result.zipcodeCounts).toEqual({ '84101': 4, '84102': 1 });
	});

	it('keeps a bucket whose value is null, which is how a skipped question counts', () => {
		expect(readParticipationDemographics(report).ethnicity).toEqual([
			{ category: 'ethnicity', value: null, count: 3 }
		]);
	});

	it('renders an empty section rather than throwing when a key is missing', () => {
		const result = readParticipationDemographics({ totalParticipants: 9 });

		expect(result.totalParticipants).toBe(9);
		expect(result.ageRanges).toEqual([]);
		expect(result.ethnicity).toEqual([]);
		expect(result.gender).toEqual([]);
		expect(result.politicalParty).toEqual([]);
		expect(result.zipcodeCounts).toEqual({});
	});

	it('drops entries with no usable count instead of charting NaN', () => {
		const result = readParticipationDemographics({
			gender: [{ value: 'woman', count: 12 }, { value: 'man' }, null, 'nonsense']
		});

		expect(result.gender).toEqual([{ value: 'woman', count: 12 }]);
	});

	it('drops zip entries whose count is not a number', () => {
		const result = readParticipationDemographics({
			zipcodeCounts: { '84101': 4, '84102': 'lots', '84103': null }
		});

		expect(result.zipcodeCounts).toEqual({ '84101': 4 });
	});

	it('answers a report that is null or the wrong type at all', () => {
		for (const input of [null, undefined, 'nope', 7]) {
			const result = readParticipationDemographics(input);
			expect(result.totalParticipants).toBe(0);
			expect(result.gender).toEqual([]);
			expect(result.zipcodeCounts).toEqual({});
		}
	});
});
