import { z } from 'zod';

/**
 * Create-Host form. Maps onto CreateOrganization (name, description, mission,
 * external_url, contact_email, org_type, regions). `mission` is not collected:
 * it is required by the API but absent from the design, so the action sends a
 * placeholder (see the action). Members are added separately from the Host's
 * own page after creation, not here. See #382, CONTEXT.md.
 */
export const createHostSchema = z.object({
	name: z.string().trim().min(1, 'Organization name is required'),
	description: z.string().trim().min(1, 'A basic description is required'),
	// Bare website (no protocol); the action prefixes https:// -> external_url.
	website: z.string().trim().default(''),
	contactEmail: z
		.union([z.literal(''), z.email('Enter a valid contact email')])
		.default(''),
	orgType: z.enum(['non_profit', 'governmental', 'other']).default('other'),
	regionIds: z.array(z.string().uuid()).default([])
});

export type CreateHostSchema = typeof createHostSchema;

/** superforms message carried back from the create action. */
export type CreateHostMessage = {
	kind: 'error';
	text?: string;
};
