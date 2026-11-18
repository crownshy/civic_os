import { describe, expect, it } from 'vitest';
import { readParticipationReport } from '@civicos/shared/data/demographics';

/**
 * Comhairle sends one `questions` entry per question the Campaign asks, keyed
 * by question id, with the raw stored answers counted. These pin that shape,
 * and the behaviour when it sends something else.
 */
describe('readParticipationReport', () => {
	const report = {
		total_participants: 42,
		questions: {
			q1: {
				question_id: 'q1',
				text: 'Do you own a dog?',
				answers: [{ value: { option_ids: ['o1'] }, count: 2 }]
			},
			q2: { question_id: 'q2', text: 'Age', answers: [{ value: 30, count: 7 }] }
		}
	};

	it('keeps every question the report carries, keyed by id', () => {
		const result = readParticipationReport(report);

		expect(result.totalParticipants).toBe(42);
		expect(Object.keys(result.questions)).toEqual(['q1', 'q2']);
		expect(result.questions.q1).toEqual({
			questionId: 'q1',
			text: 'Do you own a dog?',
			answers: [{ value: { option_ids: ['o1'] }, count: 2 }]
		});
	});

	it('has no questions rather than throwing when the key is missing', () => {
		const result = readParticipationReport({ total_participants: 9 });

		expect(result.totalParticipants).toBe(9);
		expect(result.questions).toEqual({});
	});

	it('drops answers with no usable count instead of charting NaN', () => {
		const result = readParticipationReport({
			questions: {
				g: { text: 'Gender', answers: [{ value: 'Female', count: 12 }, { value: 'Male' }, null] }
			}
		});

		expect(result.questions.g.answers).toEqual([{ value: 'Female', count: 12 }]);
	});

	it('answers a report that is null or the wrong type at all', () => {
		for (const input of [null, undefined, 'nope', 7]) {
			const result = readParticipationReport(input);
			expect(result.totalParticipants).toBe(0);
			expect(result.questions).toEqual({});
		}
	});
});
