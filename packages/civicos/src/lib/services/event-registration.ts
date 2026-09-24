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
	/** What the participant typed. The only field comhairle can keep it in is the username. */
	name: string;
}

/**
 * Sign a participant up and put them on an event's attendance list.
 *
 * Throws whatever the call rejected with, so the caller can render the server's
 * message.
 */
export async function registerForEvent(
	api: EventRegistrationApi,
	{ conversationId, eventId, email, name }: EventRegistration
): Promise<void> {
	// Their name is the username, because `UserDto` has nowhere else to put it
	// and the Host needs something to read on a registration list. Asking for a
	// username instead is what this flow used to do, and it made a participant
	// answer for comhairle's account model.
	try {
		await api.SignupOtp({ email, username: name });
	} catch (e) {
		if (httpStatusOf(e) !== 409) throw e;

		// A 409 is either the account this attendance needs already existing, or
		// somebody else having taken that username, which two people called Jane
		// Smith will manage between them. Retry under the email, which is unique
		// by construction, so only the first case survives to be swallowed.
		try {
			await api.SignupOtp({ email, username: email });
		} catch (retry) {
			if (httpStatusOf(retry) !== 409) throw retry;
		}
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
