import { z } from 'zod';

/** Add-member form for a Host's team (AddOrganizationMember). */
export const addMemberSchema = z.object({
	email: z.email('Enter a valid email'),
	role: z.enum(['admin', 'member']).default('admin')
});

export type AddMemberSchema = typeof addMemberSchema;

/** superforms message from the add-member action. */
export type AddMemberMessage = {
	kind: 'ok' | 'error';
	text: string;
};
