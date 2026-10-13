import { describe, expect, it } from 'vitest';
import { sharedCookieDomain } from './host-session';

describe('sharedCookieDomain', () => {
	it('scopes the cookie to the domain admin and the participant site share', () => {
		expect(sharedCookieDomain('adminstage.bloomproject.us', 'stage.bloomproject.us')).toBe(
			'.bloomproject.us'
		);
		expect(sharedCookieDomain('admin.bloomproject.us', 'bloomproject.us')).toBe('.bloomproject.us');
	});

	it('ignores a port or scheme on either host', () => {
		expect(sharedCookieDomain('admin.example.org:443', 'https://example.org/')).toBe(
			'.example.org'
		);
	});

	it('keeps the cookie on admin’s own host locally, where ports already share it', () => {
		expect(sharedCookieDomain('localhost:5174', 'localhost:5173')).toBeUndefined();
		expect(sharedCookieDomain('127.0.0.1:5174', '127.0.0.1:5173')).toBeUndefined();
	});

	it('keeps it there when the two share only a top-level domain, or nothing', () => {
		expect(sharedCookieDomain('admin.crownshy.org', 'bloomproject.org')).toBeUndefined();
		expect(sharedCookieDomain('admin.bloomproject.us', '')).toBeUndefined();
	});
});
