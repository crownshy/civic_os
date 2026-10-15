import { describe, expect, it } from 'vitest';
import { newPassword, username } from './account-fields';

describe('newPassword', () => {
	it('accepts 16+ characters with three character types, like comhairle', () => {
		expect(newPassword.safeParse('correcthorse4battery').success).toBe(false);
		expect(newPassword.safeParse('Correcthorse4battery').success).toBe(true);
		expect(newPassword.safeParse('correct horse battery!9').success).toBe(true);
	});

	it('rejects passwords under 16 characters', () => {
		expect(newPassword.safeParse('Short4Pass!').success).toBe(false);
	});
});

describe('username', () => {
	it('trims and accepts the characters comhairle generates', () => {
		expect(username.parse('  jane_doe-2 ')).toBe('jane_doe-2');
	});

	it('rejects spaces and very short names', () => {
		expect(username.safeParse('jane doe').success).toBe(false);
		expect(username.safeParse('jd').success).toBe(false);
	});
});
