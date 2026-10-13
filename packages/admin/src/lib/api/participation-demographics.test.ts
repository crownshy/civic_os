import { describe, expect, it } from 'vitest';
import { readParticipationReport } from '@civicos/shared/data/demographics';

/**
 * Comhairle sends one `categories` entry per question switched on for the
 * Conversation, keyed by slug and already grouped by option label. These pin
 * that shape, and the behaviour when it sends something else.
 */
describe('readParticipationReport', () => {
	const report = {
		totalParticipants: 42,
		categories: {
			age: [{ displayName: 'Age', value: '25-34', count: 7 }],
			ethnicity: [{ displayName: 'Ethnicity', value: '', count: 3 }],
			'do-you-own-a-dog': [{ displayName: 'Do you own a dog?', value: 'Yep', count: 2 }]
		}
	};

	it('keeps every question the report carries, built-in or custom', () => {
		const result = readParticipationReport(report);

		expect(result.totalParticipants).toBe(42);
		expect(Object.keys(result.categories)).toEqual(['age', 'ethnicity', 'do-you-own-a-dog']);
		expect(result.categories['do-you-own-a-dog']).toEqual([
			{ displayName: 'Do you own a dog?', value: 'Yep', count: 2 }
		]);
	});

	it('keeps the empty bucket, which is how a skipped question counts', () => {
		expect(readParticipationReport(report).categories.ethnicity).toEqual([
			{ displayName: 'Ethnicity', value: '', count: 3 }
		]);
	});

	it('has no categories rather than throwing when the key is missing', () => {
		const result = readParticipationReport({ totalParticipants: 9 });

		expect(result.totalParticipants).toBe(9);
		expect(result.categories).toEqual({});
	});

	it('drops entries with no usable count instead of charting NaN', () => {
		const result = readParticipationReport({
			categories: { gender: [{ value: 'Female', count: 12 }, { value: 'Male' }, null, 'nonsense'] }
		});

		expect(result.categories.gender).toEqual([{ value: 'Female', count: 12 }]);
	});

	it('answers a report that is null or the wrong type at all', () => {
		for (const input of [null, undefined, 'nope', 7]) {
			const result = readParticipationReport(input);
			expect(result.totalParticipants).toBe(0);
			expect(result.categories).toEqual({});
		}
	});
});
