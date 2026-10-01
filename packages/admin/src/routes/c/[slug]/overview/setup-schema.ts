import { z } from 'zod';

import { RESERVED_ROUTE_SLUGS } from '$lib/conversations';
import { TEXT_LIMITS, tooLong } from '@civicos/shared/data/text-limits';
import { blockHtmlToPlainText } from '@civicos/shared/rich-text';

/** A rich-text field, capped on the text a reader sees rather than its markup. */
const richText = (field: 'description' | 'thankYouMessage') =>
	z
		.string()
		.refine((html) => blockHtmlToPlainText(html).length <= TEXT_LIMITS[field], tooLong(field));

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
 *
 * `thankYouMessage` is a TextContent reference too, but a nullable one, so a
 * Campaign that has never had one saved has no record to write against and the
 * first save creates it. See `writeTextContent`.
 */
/**
 * Required text that is checked, not rewritten. Superforms writes the parsed
 * value back into the field while you type, so `.trim()` here would strip a
 * space the moment it was typed (#458). The save trims instead.
 */
const requiredText = (message: string) => z.string().refine((s) => s.trim().length > 0, message);

export const setupSchema = z.object({
	title: requiredText('Title is required').refine(
		(s) => s.trim().length <= TEXT_LIMITS.campaignTitle,
		tooLong('campaignTitle')
	),
	description: richText('description'),
	thankYouMessage: richText('thankYouMessage'),
	slug: z
		.string()
		.min(1, 'Slug is required')
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and single hyphens only')
		.refine((s) => !RESERVED_ROUTE_SLUGS.includes(s as never), 'That slug is reserved'),
	keyQuestion: requiredText('Key question is required').refine(
		(s) => s.trim().length <= TEXT_LIMITS.keyQuestion,
		tooLong('keyQuestion')
	)
});

export type SetupSchema = typeof setupSchema;
