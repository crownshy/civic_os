import { describe, it, expect } from 'vitest';
import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
import { setupSchema } from './setup-schema';

const title = setupSchema.shape.title;
const keyQuestion = setupSchema.shape.keyQuestion;

describe('setupSchema', () => {
	// Superforms writes the parsed value back into the field as you type, so a
	// schema that trims would eat the space before the next word (#458).
	it('leaves a trailing space in place', () => {
		expect(title.parse('Water in ')).toBe('Water in ');
		expect(keyQuestion.parse('What should ')).toBe('What should ');
	});

	it('still rejects a blank value', () => {
		expect(title.safeParse('   ').success).toBe(false);
		expect(keyQuestion.safeParse('').success).toBe(false);
	});

	it('measures the limit without surrounding whitespace', () => {
		const atLimit = 'a'.repeat(TEXT_LIMITS.campaignTitle);
		expect(title.safeParse(`${atLimit}  `).success).toBe(true);
		expect(title.safeParse(`${atLimit}a`).success).toBe(false);
	});
});
