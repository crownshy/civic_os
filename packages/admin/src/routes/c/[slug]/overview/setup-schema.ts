import { z } from 'zod';

/**
 * Editable Setup fields. These are Conversation text fields (TextContentId
 * references), edited via CreateOrUpdateTextTranslation against each field's
 * text_content_id, not UpdateConversation. See #391.
 */
export const setupSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string()
});

export type SetupSchema = typeof setupSchema;
