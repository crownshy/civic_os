import { describe, it, expect } from 'vitest';
import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
import { createConversationSchema } from './create-conversation-schema';

const base = { title: 'Water', slug: 'water', keyQuestion: 'What should we do?' };

describe('createConversationSchema', () => {
	// The form validates as you type and writes the parsed value back (#458).
	it('leaves a trailing space where it was typed', () => {
		const result = createConversationSchema.safeParse({
			...base,
			title: 'Water in ',
			keyQuestion: 'What should ',
			placeName: 'Salt Lake ',
			description: 'We are '
		});
		expect(result.success && result.data).toMatchObject({
			title: 'Water in ',
			keyQuestion: 'What should ',
			placeName: 'Salt Lake ',
			description: 'We are '
		});
	});

	it('still rejects a blank title or Key Question', () => {
		expect(createConversationSchema.safeParse({ ...base, title: '   ' }).success).toBe(false);
		expect(createConversationSchema.safeParse({ ...base, keyQuestion: '' }).success).toBe(false);
	});

	it('caps the Place name and needs it to give a slug (#495)', () => {
		const parse = (placeName: string) =>
			createConversationSchema.safeParse({ ...base, placeName }).success;
		expect(parse('')).toBe(true);
		expect(parse('x'.repeat(TEXT_LIMITS.placeName))).toBe(true);
		expect(parse('x'.repeat(TEXT_LIMITS.placeName + 1))).toBe(false);
		expect(parse('--')).toBe(false);
	});
});
