/**
 * Event times are entered as a wall-clock date and time in the event's own
 * zone, and stored as UTC instants.
 */

function tzPartsAt(ms: number, tz: string) {
	return Object.fromEntries(
		new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		})
			.formatToParts(new Date(ms))
			.map((p) => [p.type, p.value])
	);
}

/** The `<input type="date">` and `<input type="time">` values for an instant, read in `tz`. */
export function isoToWallClock(iso: string, tz: string): { date: string; time: string } {
	const p = tzPartsAt(Date.parse(iso), tz);
	const hour = p.hour === '24' ? '00' : p.hour;
	return { date: `${p.year}-${p.month}-${p.day}`, time: `${hour}:${p.minute}` };
}

/** A wall-clock date and time in `tz`, as a UTC ISO instant. */
export function zonedToISO(date: string, time: string, tz: string): string {
	const ms = Date.parse(`${date}T${time}:00Z`);
	const p = tzPartsAt(ms, tz);
	const tzAsMs = Date.UTC(
		Number(p.year),
		Number(p.month) - 1,
		Number(p.day),
		p.hour === '24' ? 0 : Number(p.hour),
		Number(p.minute),
		Number(p.second)
	);
	const offset = tzAsMs - ms;
	return new Date(ms - offset).toISOString();
}

/**
 * The earliest date, and on that date the earliest start time, an event in
 * `tz` can be given, as `min` values for the pickers (#468). The time is only
 * a floor on today: any later date can start at any time.
 */
export function earliestStart(
	tz: string,
	date: string,
	now: Date = new Date()
): { date: string; time: string | undefined } {
	const today = isoToWallClock(now.toISOString(), tz);
	return { date: today.date, time: date === today.date ? today.time : undefined };
}

/** Every quarter hour of a day as `HH:MM`, the only times the event pickers offer (#483). */
export const QUARTER_HOURS: string[] = Array.from({ length: 96 }, (_, i) => {
	const hour = String(Math.floor(i / 4)).padStart(2, '0');
	const minute = String((i % 4) * 15).padStart(2, '0');
	return `${hour}:${minute}`;
});

/** An `HH:MM` wall-clock time as it reads on the picker, e.g. `14:30` as `2:30 PM`. */
export function formatWallTime(time: string): string {
	const [hour, minute] = time.split(':').map(Number);
	const period = hour < 12 ? 'AM' : 'PM';
	return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${period}`;
}

/** A `YYYY-MM-DD` date as it reads on the picker, e.g. `Thu, Oct 1, 2026`. */
export function formatWallDate(date: string): string {
	return new Intl.DateTimeFormat('en-US', {
		timeZone: 'UTC',
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}).format(new Date(`${date}T00:00:00Z`));
}

export const PAST_START_MESSAGE = "The event can't start in the past.";
