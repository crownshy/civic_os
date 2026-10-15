import { describe, expect, it } from 'vitest';
import { isExpired, readEmailLinkToken } from './email-link-token';

function tokenWith(claims: object) {
	const encode = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
	return `${encode({ alg: 'HS256' })}.${encode(claims)}.signature`;
}

describe('readEmailLinkToken', () => {
	it('reads the email and expiry comhairle puts in an email link', () => {
		const token = tokenWith({ sub: 'x', id: 'x', exp: 1_800_000_000, email: 'new@host.org' });
		expect(readEmailLinkToken(token)).toEqual({
			email: 'new@host.org',
			expiresAt: new Date(1_800_000_000_000)
		});
	});

	it('returns null for something that is not a JWT', () => {
		expect(readEmailLinkToken('not-a-token')).toBeNull();
		expect(readEmailLinkToken('a.%%%.c')).toBeNull();
	});

	it('tolerates a token without an email claim', () => {
		expect(readEmailLinkToken(tokenWith({ exp: 1 }))?.email).toBeNull();
	});
});

describe('isExpired', () => {
	const now = new Date('2026-10-14T12:00:00Z');

	it('is expired once exp has passed', () => {
		expect(isExpired({ email: null, expiresAt: new Date('2026-10-14T11:59:59Z') }, now)).toBe(true);
	});

	it('is not expired before exp, or when there is no exp to check', () => {
		expect(isExpired({ email: null, expiresAt: new Date('2026-10-15T00:00:00Z') }, now)).toBe(
			false
		);
		expect(isExpired({ email: null, expiresAt: null }, now)).toBe(false);
	});
});
