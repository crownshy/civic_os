import { PAST_START_MESSAGE, zonedToISO } from '$lib/utils/event-time';

export type LocationForm = {
	venue_name: string;
	address_line_1: string;
	address_line_2: string;
	city: string;
	state_province: string;
	postal_code: string;
	country_code: string;
};

/** The API has two formats; `online` splits by whether a custom link is set. */
export type MeetMode = 'in_person' | 'civicos_online' | 'external_online';

export type EventForm = {
	name: string;
	description: string;
	meet_mode: MeetMode;
	custom_event_link: string;
	start_date: string;
	start_time: string;
	end_time: string;
	// A number input binds a number, or null when cleared.
	capacity: number | null;
	signup_mode: 'open' | 'invite';
	time_zone: string;
	location: LocationForm;
};

/** What `EventFields` reports as finished editing, so the edit page can save that part. */
export type EventField =
	'name' | 'times' | 'meetMode' | 'link' | 'location' | 'description' | 'capacity' | 'signup';

export const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const emptyLocation = (): LocationForm => ({
	venue_name: '',
	address_line_1: '',
	address_line_2: '',
	city: '',
	state_province: '',
	postal_code: '',
	country_code: ''
});

export const emptyEventForm = (): EventForm => ({
	name: '',
	description: '',
	meet_mode: 'in_person',
	custom_event_link: '',
	start_date: '',
	start_time: '',
	end_time: '',
	capacity: null,
	signup_mode: 'open',
	time_zone: BROWSER_TZ,
	location: emptyLocation()
});

/** The location when every required field is filled, else null. */
export function completeLocation(l: LocationForm): LocationForm | null {
	const required = [
		l.venue_name,
		l.address_line_1,
		l.city,
		l.state_province,
		l.postal_code,
		l.country_code
	];
	return required.some((v) => !v.trim()) ? null : l;
}

export function isBlankLocation(l: LocationForm): boolean {
	return Object.values(l).every((v) => !v.trim());
}

/** A positive whole capacity, or null for "no limit". */
export function parseCapacity(raw: number | null): number | null {
	return raw != null && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
}

/** What is wrong with each field, keyed so the message can sit beside it. */
export type EventFieldErrors = Partial<Record<EventField, string>>;

/**
 * Why a new event cannot be created yet, per field. Empty when it can.
 */
export function newEventProblems(form: EventForm, now: number = Date.now()): EventFieldErrors {
	const problems: EventFieldErrors = {};

	const name = form.name.trim();
	if (!name) problems.name = 'Give the event a name.';

	if (!form.start_date || !form.start_time || !form.end_time) {
		problems.times = 'Pick a date, start time and end time.';
	} else if (form.end_time <= form.start_time) {
		problems.times = 'The end time must be after the start time.';
	} else if (Date.parse(zonedToISO(form.start_date, form.start_time, form.time_zone)) < now) {
		problems.times = PAST_START_MESSAGE;
	}

	const link = form.custom_event_link.trim();
	if (form.meet_mode === 'external_online' && !link) {
		problems.link = 'Add the meeting link participants should join.';
	}

	if (form.meet_mode === 'in_person') {
		// A venue can be added later, but half an address would be dropped silently.
		if (!isBlankLocation(form.location) && !completeLocation(form.location)) {
			problems.location = 'Finish the address, or clear it and add it later.';
		}
	}

	return problems;
}
