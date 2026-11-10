import { differenceInCalendarDays } from 'date-fns';

export function formatTimeDuration(start: Date, end: Date) {
	const durationMs = start.getTime() - end.getTime();
	const totalSeconds = Math.floor(Math.abs(durationMs) / 1000);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	return { hours, minutes };
}

/**
 * The countdown line above an event's Register button, in calendar days so an
 * evening event tomorrow reads "tomorrow" rather than "in 0 days". Null once
 * the day has passed.
 */
export function eventCountdownLabel(start: Date, now: Date): string | null {
	const days = differenceInCalendarDays(start, now);
	if (days < 0) return null;
	if (days === 0) return 'Event is today';
	if (days === 1) return 'Event starts tomorrow';
	return `Event starts in ${days} days`;
}
