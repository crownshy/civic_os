import { z } from 'zod';

/** Editable Setup fields wired to UpdateConversation (real Conversation columns). */
export const setupSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string()
});

export type SetupSchema = typeof setupSchema;
