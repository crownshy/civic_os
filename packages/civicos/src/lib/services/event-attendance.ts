import type { ApiClient } from '@crownshy/api-client/api';

export type AttendanceApi = Pick<ApiClient, 'ListEventAttendances'>;

export interface AttendanceLookup {
	/** The Campaign's Conversation, which is the one the event belongs to. */
	conversationId: string;
	eventId: string;
	/** Who to look for. Empty for a visitor the cookie does not name. */
	userId: string;
	/** Matched as well, because registering by email is how most attendance is created. */
	email?: string | null;
}

export interface AttendanceAnswer {
	registered: boolean;
	/**
	 * Whether the backend actually answered. False is not "not registered": the
	 * caller keeps its cached flag rather than showing a registered participant
	 * the signup form again.
	 */
	resolved: boolean;
}

/**
 * Comhairle has no "is this user attending" route, only the event's full list,
 * so this pages through it. A hundred at a time, up to ten pages: a real event
 * has attendees in the low hundreds, and an unbounded walk on a page load is
 * worse than an unresolved answer.
 */
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

/**
 * Whether this participant is on an event's attendance list.
 *
 * The server is the authority on this. localStorage was, which meant clearing
 * site data or opening the event on a second device showed someone who had
 * already registered the signup form again (#420).
 */
export async function findAttendance(
	api: AttendanceApi,
	{ conversationId, eventId, userId, email }: AttendanceLookup
): Promise<AttendanceAnswer> {
	if (!conversationId || !eventId || !userId) return { registered: false, resolved: true };

	const wanted = email?.trim().toLowerCase();

	try {
		for (let page = 0; page < MAX_PAGES; page++) {
			const result = await api.ListEventAttendances({
				params: { conversation_id: conversationId, event_id: eventId },
				queries: { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
			});

			const records = result?.records ?? [];
			const mine = records.some(
				(record) =>
					record.userId === userId || (!!wanted && record.email?.trim().toLowerCase() === wanted)
			);
			if (mine) return { registered: true, resolved: true };

			if (records.length < PAGE_SIZE) return { registered: false, resolved: true };
		}

		// Ran out of pages with the answer still ahead of us. Saying "not
		// registered" here would be a guess dressed as a fact.
		return { registered: false, resolved: false };
	} catch (e) {
		console.error('[EventAttendance] Could not read the attendance list:', e);
		return { registered: false, resolved: false };
	}
}
