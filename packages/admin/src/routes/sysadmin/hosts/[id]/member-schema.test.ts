import { describe, expect, it } from 'vitest';
import { addMemberSchema } from './member-schema';

describe('addMemberSchema', () => {
	it('trims and lowercases the email before it is sent', () => {
		expect(addMemberSchema.parse({ email: '  Ana@Example.ORG ' }).email).toBe('ana@example.org');
	});

	it('still refuses something that is not an email', () => {
		expect(addMemberSchema.safeParse({ email: 'not an email' }).success).toBe(false);
	});
});
