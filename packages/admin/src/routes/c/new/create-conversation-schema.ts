import { z } from 'zod';

import { RESERVED_ROUTE_SLUGS } from '$lib/conversations';

/**
 * Create-Campaign form.
 *
 * Creating a Campaign is not one call: comhairle models the Conversation, its
 * workflow, and the Polis poll separately, so the action fans this one form out
 * across CreateConversation, CreateConversationWorkflow and
 * CreateConversationWorkflowStep. See the action for the order and the rollback.
 *
 * `keyQuestion` becomes the Polis conversation's topic (CONTEXT.md: Key
 * Question). It is collected here rather than left for Setup because the Polis
 * poll is provisioned at create time and `tool_setup` requires a topic.
 */
export const createConversationSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	slug: z
		.string()
		.trim()
		.min(1, 'Slug is required')
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and single hyphens only')
		.refine((s) => !RESERVED_ROUTE_SLUGS.includes(s as never), 'That slug is reserved'),
	keyQuestion: z.string().trim().min(1, 'Key question is required'),
	description: z.string().trim().default(''),
	/** Owning Host. Empty when the user belongs to exactly one, or to none. */
	hostId: z.string().default('')
});

export type CreateConversationSchema = typeof createConversationSchema;

/** superforms message carried back from the create action. */
export type CreateConversationMessage = {
	kind: 'error';
	text?: string;
};
