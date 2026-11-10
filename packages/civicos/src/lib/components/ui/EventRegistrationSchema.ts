import { z } from 'zod';
import { TEXT_LIMITS, tooLong } from '@civicos/shared/data/text-limits';
import { ZIP_LOOKUP } from '@civicos/shared/data/zipcodes';

/**
 * What someone signing up for an event is asked for.
 *
 * A name, an email and a zip: the same as joining the Open Poll, plus a name
 * the Host can read on the registration list.
 * It used to ask for a comhairle username instead, because the account
 * `registerForEvent` needs behind the attendance has one; that is an
 * implementation detail of the backend and not something to make a participant
 * invent at the door.
 */
const eventRegistrationSchema = z.object({
	email: z.email('Please enter a valid email').max(TEXT_LIMITS.email, tooLong('email')),
	name: z
		.string()
		.trim()
		.min(2, { message: 'Please enter your name' })
		.max(TEXT_LIMITS.participantName, tooLong('participantName')),
	zipCode: z
		.string()
		.trim()
		.refine((zip) => ZIP_LOOKUP.has(zip), 'Please pick your zip code from the list')
});

export type EventRegistrationSchema = z.infer<typeof eventRegistrationSchema>;

export default eventRegistrationSchema;
