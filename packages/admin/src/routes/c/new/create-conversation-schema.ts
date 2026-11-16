import { z } from 'zod';

import { RESERVED_ROUTE_SLUGS } from '$lib/conversations';
import { limitedText, requiredText } from '$lib/validation/text-fields';

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
	// Checked, not trimmed: the form validates as you type (see `limitedText`).
	// The action trims. A slug has no spaces to lose, so it keeps its trim.
	title: requiredText('campaignTitle', 'Title is required'),
	slug: z
		.string()
		.trim()
		.min(1, 'Slug is required')
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and single hyphens only')
		.refine((s) => !RESERVED_ROUTE_SLUGS.includes(s as never), 'That slug is reserved'),
	keyQuestion: requiredText('keyQuestion', 'Key question is required'),
	/**
	 * The states, counties and cities it runs in, from the place selector (#514).
	 * The Place pages it is listed on follow from these; the Host never names one.
	 */
	areas: z
		.array(
			z.object({
				geoid: z.string().regex(/^\d+$/),
				level: z.enum(['state', 'county', 'city']),
				name: z.string().trim().min(1)
			})
		)
		.default([]),
	description: limitedText('description').default(''),
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
