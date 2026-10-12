import { z } from 'zod';

/** Add-member form for a Host's team (AddOrganizationMember). */
export const addMemberSchema = z.object({
	// Trimmed and lowercased first: comhairle matches the address as sent, so
	// " Ana@Example.org" would otherwise reach a different account, or none.
	email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
	role: z.enum(['admin', 'member']).default('admin')
});

export type AddMemberSchema = typeof addMemberSchema;

/** superforms message from the add-member action. */
export type AddMemberMessage = {
	kind: 'ok' | 'error';
	text: string;
};
