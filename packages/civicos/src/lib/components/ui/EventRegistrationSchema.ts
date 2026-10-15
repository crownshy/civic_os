import { z } from 'zod';
import { TEXT_LIMITS, tooLong } from '@civicos/shared/data/text-limits';

/**
 * What someone signing up for an event is asked for.
 *
 * A name and an email, which is what the flow was always meant to collect.
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
		.max(TEXT_LIMITS.participantName, tooLong('participantName'))
});

export type EventRegistrationSchema = z.infer<typeof eventRegistrationSchema>;

export default eventRegistrationSchema;
