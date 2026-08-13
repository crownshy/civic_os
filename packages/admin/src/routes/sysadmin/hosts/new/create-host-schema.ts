import { z } from 'zod';

/** Split a raw textarea/comma list into trimmed, non-empty email tokens. */
export function parseEmailList(raw: string | undefined | null): string[] {
	return (raw ?? '')
		.split(/[\n,]/)
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * Create-Host form. Maps onto CreateOrganization (name, description, mission,
 * external_url, contact_email, org_type, regions). `mission` is not collected:
 * it is required by the API but absent from the design, so the action sends a
 * placeholder (see the action). Member emails are added after creation via
 * AddOrganizationMember, not the create body. See #382, CONTEXT.md.
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
	regionIds: z.array(z.string().uuid()).default([]),
	// One email per line or comma-separated; each becomes an org admin (invited).
	memberEmailsRaw: z
		.string()
		.default('')
		.refine((raw) => parseEmailList(raw).every((e) => z.email().safeParse(e).success), {
			message: 'One or more emails are invalid. Use valid addresses, one per line.'
		})
});

export type CreateHostSchema = typeof createHostSchema;

/** Result of inviting one member email (AddOrganizationMember). */
export type MemberResult = {
	email: string;
	createdAccount?: boolean;
	emailed?: boolean;
	error?: string;
};

/** superforms message carried back from the create action. */
export type CreateHostMessage = {
	kind: 'partial' | 'error';
	orgName?: string;
	members?: MemberResult[];
	text?: string;
};
