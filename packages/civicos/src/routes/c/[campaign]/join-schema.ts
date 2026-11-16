import { z } from 'zod';
import { ZIP_LOOKUP } from '@civicos/shared/data/zipcodes';
import { TEXT_LIMITS, tooLong } from '@civicos/shared/data/text-limits';

/**
 * What the Open Poll's join sheet asks for. A signed-in participant's email
 * comes from their account and is not edited here, so the field is still
 * required: the sheet fills it in.
 */
export const joinSchema = z.object({
	email: z.email('Please enter a valid email').max(TEXT_LIMITS.email, tooLong('email')),
	zipCode: z
		.string()
		.trim()
		.refine((zip) => ZIP_LOOKUP.has(zip), 'Please pick your zip code from the list')
});

/** The code comhairle emails to an address that already has an account. */
export const loginCodeSchema = z.object({
	code: z.string().trim().min(4, 'Please enter the code from your email')
});
