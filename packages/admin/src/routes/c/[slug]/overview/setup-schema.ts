import { z } from 'zod';

import { RESERVED_ROUTE_SLUGS } from '$lib/conversations';

/**
 * Editable Setup fields.
 *
 * `title` and `description` are Conversation text fields (TextContentId
 * references), edited via CreateOrUpdateTextTranslation against each field's
 * text_content_id, not UpdateConversation. See #391.
 *
 * `slug` is a plain column on Conversation, so it is written through
 * UpdateConversation. It is also the `/c/<slug>` route segment and the public
 * URL, which is why it commits explicitly rather than on the debounce.
 *
 * `keyQuestion` is not a Conversation field at all: it is the `topic` of the
 * Polis conversation behind this Campaign's Polis workflow step, written with
 * PolisUpdateConfig.
 */
export const setupSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string(),
	slug: z
		.string()
		.min(1, 'Slug is required')
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and single hyphens only')
		.refine((s) => !RESERVED_ROUTE_SLUGS.includes(s as never), 'That slug is reserved'),
	keyQuestion: z.string().min(1, 'Key question is required')
});

export type SetupSchema = typeof setupSchema;
