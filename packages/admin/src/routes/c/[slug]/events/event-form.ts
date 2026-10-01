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
