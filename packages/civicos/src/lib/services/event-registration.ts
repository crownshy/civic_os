import type { ApiClient } from '@crownshy/api-client/api';
import { httpErrorMessage, httpStatusOf } from '$lib/utils/http';

type EventRegistrationApi = Pick<ApiClient, 'SignupOtp' | 'CreateEventAttendance'>;

export interface EventRegistration {
	/**
	 * The Campaign's Conversation, which is the one the event belongs to. Not the
	 * `regions.ts` entry the subdomain matched: that answers `GENERIC_REGION` for
	 * any subdomain it does not know, and its `conversationId` is a live poll, so
	 * a wrong value here files a participant's email in someone else's records
	 * rather than failing.
	 */
	conversationId: string;
	eventId: string;
	email: string;
	username: string;
}

/**
 * Sign a participant up and put them on an event's attendance list.
 *
 * Throws whatever the call rejected with, so the caller can render the server's
 * message.
 */
export async function registerForEvent(
	api: EventRegistrationApi,
	{ conversationId, eventId, email, username }: EventRegistration
): Promise<void> {
	try {
		await api.SignupOtp({ email, username });
	} catch (e) {
		// 409 is comhairle saying the account already exists, which is the state
		// the attendance needs. Anything else means there is nobody to register.
		if (httpStatusOf(e) !== 409) throw e;
	}

	await api.CreateEventAttendance(
		{ role: 'participant', user_email: email },
		{ params: { conversation_id: conversationId, event_id: eventId } }
	);
}

const FALLBACK_MESSAGE = 'Something went wrong registering you for the event';

/** What to show a participant whose registration failed. */
export function registrationErrorMessage(e: unknown): string {
	return httpErrorMessage(e) ?? FALLBACK_MESSAGE;
}
