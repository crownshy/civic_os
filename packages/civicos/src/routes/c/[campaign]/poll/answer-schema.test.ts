import { describe, expect, it } from 'vitest';
import type { QuestionVersionDto } from '@crownshy/api-client/api';
import { questionsForCampaign } from '$lib/services/demographics';
import { answerSchema } from './answer-schema';

function item(changes: Partial<QuestionVersionDto> = {}, required = false) {
	const version: QuestionVersionDto = {
		id: 'v1',
		question_id: 'q1',
		text: 'Question',
		question_type: 'text',
		options: [],
		allow_other: false,
		prefer_not_to_say: false,
		special_category: false,
		status: 'published',
		updated_at: '2026-01-01T00:00:00Z',
		version_number: 1,
		...changes
	};
	return questionsForCampaign(
		[{ version, required, skipped: false, consent: 'none' }],
		[],
		'campaign'
	)[0];
}

describe('answerSchema', () => {
	it('requires answers only when marked required and requires special-category consent', () => {
		const question = item({ special_category: true, consent_text: 'Share?' }, true);
		const schema = answerSchema([question]);
		expect(schema.safeParse({ answers: { v1: question.initial } }).success).toBe(false);
		expect(
			schema.safeParse({ answers: { v1: { ...question.initial, value: 'answer' } } }).success
		).toBe(false);
		expect(
			schema.safeParse({
				answers: { v1: { ...question.initial, value: 'answer', consent: true } }
			}).success
		).toBe(true);
	});

	it('rejects invalid numbers and dates, including impossible calendar dates', () => {
		const number = item({ question_type: 'number' });
		const date = item({ question_type: 'date', date_precision: 'day' });
		expect(
			answerSchema([number]).safeParse({ answers: { v1: { ...number.initial, value: 'no' } } })
				.success
		).toBe(false);
		expect(
			answerSchema([date]).safeParse({ answers: { v1: { ...date.initial, value: '2025-02-29' } } })
				.success
		).toBe(false);
		expect(
			answerSchema([date]).safeParse({ answers: { v1: { ...date.initial, value: '2024-02-29' } } })
				.success
		).toBe(true);
	});

	it('checks selection limits and requires text when Other is selected', () => {
		const question = item({
			question_type: 'multi_select',
			max_selections: 1,
			allow_other: true,
			options: [
				{ id: 'a', label: 'A', position: 0 },
				{ id: 'b', label: 'B', position: 1 }
			]
		});
		const schema = answerSchema([question]);
		expect(
			schema.safeParse({ answers: { v1: { ...question.initial, optionIds: ['a', 'b'] } } }).success
		).toBe(false);
		expect(
			schema.safeParse({ answers: { v1: { ...question.initial, other: true } } }).success
		).toBe(false);
	});
});
