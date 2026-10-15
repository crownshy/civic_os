import { describe, it, expect } from 'vitest';
import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
import { PAST_START_MESSAGE } from '$lib/utils/event-time';
import { emptyEventForm, newEventProblems, type EventForm } from './event-form';

const NOW = Date.parse('2026-06-01T12:00:00Z');

function filled(overrides: Partial<EventForm> = {}): EventForm {
	return {
		...emptyEventForm(),
		name: 'Town hall',
		start_date: '2026-07-01',
		start_time: '18:00',
		end_time: '20:00',
		time_zone: 'UTC',
		...overrides
	};
}

describe('newEventProblems', () => {
	it('passes a complete event', () => {
		expect(newEventProblems(filled(), NOW)).toEqual({});
	});

	it('puts each problem on its own field', () => {
		const problems = newEventProblems(
			filled({ name: ' ', start_date: '', meet_mode: 'external_online' }),
			NOW
		);
		expect(Object.keys(problems).sort()).toEqual(['link', 'name', 'times']);
	});

	it('refuses an end before the start, and a start in the past', () => {
		expect(newEventProblems(filled({ end_time: '17:00' }), NOW).times).toMatch(/after the start/);
		expect(newEventProblems(filled({ start_date: '2026-05-01' }), NOW).times).toBe(
			PAST_START_MESSAGE
		);
	});

	it('refuses half an address but not an empty one', () => {
		expect(newEventProblems(filled(), NOW).location).toBeUndefined();
		const half = { ...emptyEventForm().location, venue_name: 'Library' };
		expect(newEventProblems(filled({ location: half }), NOW).location).toMatch(/Finish/);
	});

	// The inputs stop typing at the cap; this catches text that got past them (#495).
	it('refuses text over the caps', () => {
		const location = {
			venue_name: 'x'.repeat(TEXT_LIMITS.eventAddressLine + 1),
			address_line_1: '1 Main St',
			address_line_2: '',
			city: 'Dundee',
			state_province: 'Angus',
			postal_code: 'DD1',
			country_code: 'GB'
		};
		const problems = newEventProblems(
			filled({
				name: 'x'.repeat(TEXT_LIMITS.eventName + 1),
				description: 'x'.repeat(TEXT_LIMITS.eventDescription + 1),
				location
			}),
			NOW
		);
		expect(Object.keys(problems).sort()).toEqual(['description', 'location', 'name']);

		const link = `https://x.org/${'x'.repeat(TEXT_LIMITS.eventLink)}`;
		expect(
			newEventProblems(filled({ meet_mode: 'external_online', custom_event_link: link }), NOW).link
		).toMatch(/characters or fewer/);
	});
});
