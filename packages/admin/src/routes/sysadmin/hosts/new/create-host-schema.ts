import { z } from 'zod';
import { limitedText, requiredText } from '$lib/validation/text-fields';

/**
 * Create-Host form. Maps onto CreateOrganization (name, description, mission,
 * external_url, contact_email, org_type, regions). `mission` is not collected:
 * it is required by the API but absent from the design, so the action sends a
 * placeholder (see the action). Members are added separately from the Host's
 * own page after creation, not here. See #382, CONTEXT.md.
 */
export const createHostSchema = z.object({
	// A symbol alone ("-", "?") is not a name anyone can pick out of a list (#492).
	name: requiredText('hostName', 'Organization name is required').refine(
		(s) => /[\p{L}\p{N}]/u.test(s),
		'Use at least one letter or number'
	),
	// Optional: a Host can be created first and describe itself later (#475).
	description: limitedText('hostDescription').default(''),
	// Bare website (no protocol); the action prefixes https:// -> external_url.
	website: z.string().default(''),
	contactEmail: z.union([z.literal(''), z.email('Enter a valid contact email')]).default(''),
	orgType: z.enum(['non_profit', 'governmental', 'other']).default('other'),
	regionIds: z.array(z.string().uuid()).default([])
});

export type CreateHostSchema = typeof createHostSchema;

/** superforms message carried back from the create action. */
export type CreateHostMessage = {
	kind: 'error';
	text?: string;
};
