import { describe, expect, it } from 'vitest';
import { createAdminCache } from './admin-gate';

function clock(start = 0) {
	let t = start;
	return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe('createAdminCache', () => {
	it('knows nothing about a session it has not seen', () => {
		expect(createAdminCache().has('token')).toBe(false);
	});

	it('remembers a pass until the ttl runs out', () => {
		const c = clock();
		const cache = createAdminCache(1_000, c.now);
		cache.remember('token');
		c.advance(999);
		expect(cache.has('token')).toBe(true);
		c.advance(1);
		expect(cache.has('token')).toBe(false);
	});

	it('keeps sessions apart', () => {
		const cache = createAdminCache();
		cache.remember('a');
		expect(cache.has('b')).toBe(false);
	});
});
