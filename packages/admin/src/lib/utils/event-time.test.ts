import { describe, it, expect } from 'vitest';
import { earliestStart, isoToWallClock, zonedToISO } from './event-time';

// 2026-10-01 03:30 UTC, which is still 30 September in Denver (UTC-6).
const now = new Date('2026-10-01T03:30:00Z');

describe('earliestStart', () => {
	it("floors the date at today in the event's zone, not the browser's", () => {
		expect(earliestStart('UTC', '', now).date).toBe('2026-10-01');
		expect(earliestStart('America/Denver', '', now).date).toBe('2026-09-30');
	});

	it('floors the start time only on today', () => {
		expect(earliestStart('America/Denver', '2026-09-30', now).time).toBe('21:30');
		expect(earliestStart('America/Denver', '2026-10-02', now).time).toBeUndefined();
	});
});

describe('zonedToISO', () => {
	it('round-trips through isoToWallClock', () => {
		const iso = zonedToISO('2026-11-14', '18:00', 'America/Denver');
		expect(iso).toBe('2026-11-15T01:00:00.000Z');
		expect(isoToWallClock(iso, 'America/Denver')).toEqual({ date: '2026-11-14', time: '18:00' });
	});
});
