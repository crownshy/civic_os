import type { RequestHandler } from '@sveltejs/kit';
import { getEventFullDescription } from '$lib/config/regions';

function tzFromISO(iso: string): string {
	const m = iso.match(/([+-]\d{2}:\d{2})$/);
	const map: Record<string, string> = {
		'-04:00': 'America/New_York',
		'-05:00': 'America/Chicago',
		'-06:00': 'America/Denver',
		'-07:00': 'America/Los_Angeles'
	};
	return (m && map[m[1]]) ?? 'America/Denver';
}

function isoToICSLocal(iso: string): string {
	const [date, time] = iso.split('T');
	return date.replace(/-/g, '') + 'T' + time.slice(0, 8).replace(/:/g, '');
}

function endTimeToICSLocal(iso: string, endTime12h: string): string {
	const date = iso.split('T')[0].replace(/-/g, '');
	const m = endTime12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
	if (!m) return isoToICSLocal(iso);
	let h = parseInt(m[1]);
	if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
	else if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
	return `${date}T${String(h).padStart(2, '0')}${m[2]}00`;
}

function escapeICS(str: string): string {
	return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function fold(line: string): string {
	const out: string[] = [];
	while (line.length > 75) {
		out.push(line.slice(0, 75));
		line = ' ' + line.slice(75);
	}
	out.push(line);
	return out.join('\r\n');
}

export const GET: RequestHandler = ({ params, locals }) => {
	const region = locals.region;
	const event = region.events.find((e) => e.slug === params.slug);
	if (!event) return new Response('Not found', { status: 404 });

	const tz = tzFromISO(event.date);
	const dtStart = isoToICSLocal(event.date);
	const dtEnd = event.endTime ? endTimeToICSLocal(event.date, event.endTime) : dtStart;

	const location =
		event.format === 'online'
			? 'Videoconference link to be sent 1 day before call.'
			: [event.venueName, event.address].filter(Boolean).join(', ');

	const description = escapeICS(
		`${event.fullDescription ?? getEventFullDescription(event, region.stateName)}\n\nHosted by ${region.hostName}. Visit ${region.hostUrl} for more details.`
	);

	const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
	const eventUrl = `${region.shareUrl}/conversations/${event.slug}`;

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Bloom Project//bloomproject.us//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${event.slug}@bloomproject.us`,
		`DTSTAMP:${now}`,
		`DTSTART;TZID=${tz}:${dtStart}`,
		`DTEND;TZID=${tz}:${dtEnd}`,
		`SUMMARY:${escapeICS(event.title)}`,
		`DESCRIPTION:${description}`,
		`LOCATION:${escapeICS(location)}`,
		`URL:${eventUrl}`,
		'END:VEVENT',
		'END:VCALENDAR'
	]
		.map(fold)
		.join('\r\n');

	return new Response(lines, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="${event.slug}.ics"`
		}
	});
};
