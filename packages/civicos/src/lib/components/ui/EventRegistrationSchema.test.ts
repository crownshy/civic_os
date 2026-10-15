import { describe, it, expect } from 'vitest';
import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
import eventRegistrationSchema from './EventRegistrationSchema';

const parse = (fields: { name?: string; email?: string }) =>
	eventRegistrationSchema.safeParse({ name: 'Ana Ruiz', email: 'ana@example.org', ...fields })
		.success;

describe('eventRegistrationSchema', () => {
	it('accepts a name and an email', () => {
		expect(parse({})).toBe(true);
	});

	it('caps the name (#495)', () => {
		expect(parse({ name: 'x'.repeat(TEXT_LIMITS.participantName) })).toBe(true);
		expect(parse({ name: 'x'.repeat(TEXT_LIMITS.participantName + 1) })).toBe(false);
	});

	it('caps the email (#495)', () => {
		const domain = '@example.org';
		const email = `${'a'.repeat(TEXT_LIMITS.email - domain.length)}${domain}`;
		expect(parse({ email })).toBe(true);
		expect(parse({ email: `a${email}` })).toBe(false);
	});
});
