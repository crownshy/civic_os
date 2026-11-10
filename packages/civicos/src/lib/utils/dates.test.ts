import { describe, expect, it } from 'vitest';
import { eventCountdownLabel } from './dates';

const NOW = new Date(2026, 4, 1, 18, 0);

describe('eventCountdownLabel', () => {
	it('counts calendar days, not 24 hour blocks', () => {
		expect(eventCountdownLabel(new Date(2026, 4, 2, 9, 0), NOW)).toBe('Event starts tomorrow');
		expect(eventCountdownLabel(new Date(2026, 4, 4, 9, 0), NOW)).toBe('Event starts in 3 days');
	});

	it('says today on the day', () => {
		expect(eventCountdownLabel(new Date(2026, 4, 1, 20, 0), NOW)).toBe('Event is today');
	});

	it('has nothing to say once the day has passed', () => {
		expect(eventCountdownLabel(new Date(2026, 3, 30, 20, 0), NOW)).toBeNull();
	});
});
