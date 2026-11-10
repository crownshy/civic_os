import { z } from 'zod';
import { TEXT_LIMITS, tooLong } from '@civicos/shared/data/text-limits';

/** The name on a participant's profile, which comhairle keeps as the username. */
export const profileNameSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, 'Please enter your name')
		.max(TEXT_LIMITS.participantName, tooLong('participantName'))
});
