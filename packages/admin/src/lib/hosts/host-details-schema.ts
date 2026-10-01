import { z } from 'zod';
import { limitedText, requiredText } from '$lib/validation/text-fields';

/**
 * A Host's own details, as Create Host collects them and the Host page edits
 * them. Maps onto CreateOrganization and UpdateOrganization (name,
 * description, external_url, contact_email, org_type, regions). `mission` is
 * not collected: create sends a placeholder. Members are managed separately on
 * the Host's page. See #382, #450, CONTEXT.md.
 */
export const hostDetailsSchema = z.object({
	// A symbol alone ("-", "?") is not a name anyone can pick out of a list (#492).
	name: requiredText('hostName', 'Organization name is required').refine(
		(s) => /[\p{L}\p{N}]/u.test(s),
		'Use at least one letter or number'
	),
	// Optional: a Host can be created first and describe itself later (#475).
	description: limitedText('hostDescription').default(''),
	// Bare website (no protocol); see `toExternalUrl`.
	website: z.string().default(''),
	contactEmail: z.union([z.literal(''), z.email('Enter a valid contact email')]).default(''),
	orgType: z.enum(['non_profit', 'governmental', 'other']).default('other'),
	regionIds: z.array(z.string().uuid()).default([])
});

export type HostDetailsSchema = typeof hostDetailsSchema;

/** superforms message carried back from a create or update action. */
export type HostDetailsMessage = {
	kind: 'error' | 'ok';
	text?: string;
};

/** The form's bare website as a stored `external_url`, adding https:// when no protocol was typed. */
export function toExternalUrl(website: string): string {
	const trimmed = website.trim();
	if (!trimmed) return '';
	return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** A stored `external_url` as the form shows it, after its fixed https:// prefix. */
export function toWebsite(externalUrl: string | null | undefined): string {
	return (externalUrl ?? '').replace(/^https:\/\//, '');
}
