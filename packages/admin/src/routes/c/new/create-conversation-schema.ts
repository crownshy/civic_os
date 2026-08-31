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
	/**
	 * Where the Campaign runs, collected here so it has a Place from the start
	 * rather than only once someone visits Setup. Optional: a Campaign with no
	 * Place is served from the apex, and the Place can be changed later.
	 *
	 * A name, not a slug. The subdomain is derived (`placeFromName`), and the
	 * Conversation slug is scoped to it by the action, the same rule Setup
	 * applies on a Place change.
	 */
	placeName: z.string().trim().default(''),
	description: z.string().trim().default(''),
	/**
	 * Owning Host. Preselected in `load` from the Host the creator belongs to;
	 * empty only when they belong to none, which the action refuses.
	 */
	hostId: z.string().default(''),
	/**
	 * Other Hosts to attach as Co-Hosts (CONTEXT.md: a Campaign has one owning
	 * Host and zero or more Co-Hosts). Granted after the Conversation exists,
	 * since the grant is keyed by its id.
	 */
	cohostIds: z.array(z.string()).default([])
});

export type CreateConversationSchema = typeof createConversationSchema;

/** superforms message carried back from the create action. */
export type CreateConversationMessage = {
	kind: 'error';
	text?: string;
};
