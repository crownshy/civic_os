import { error } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import { REGIONS } from '$lib/config/regions';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, cookies, url, depends }) => {
	depends(`region:conversation:${params.slug}`);

	const region = REGIONS[params.slug];
	if (!region) {
		error(404, `Unknown conversation: ${params.slug}`);
	}

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
	let conversation = null;
	try {
		// withTranslations (admin only) returns the resolved display strings *and*
		// each text field's TextContent id + locale. Those ids are what edits are
		// written against: Conversation.title/description are TextContentId (UUID)
		// references, not text columns, so they can only be edited via the
		// translations endpoints, never UpdateConversation. See #391.
		conversation = await api.GetConversation({
			params: { conversation_id: region.conversationId },
			queries: { withTranslations: true }
		});
	} catch (e) {
		console.warn('GetConversation failed', e);
	}

	// Pull out the { id, locale } we POST title/description edits against. Null
	// when the backend didn't return translation detail (non-admin, or the
	// conversation id doesn't resolve on this backend), in which case those
	// fields fall back to read-only rendering.
	//
	// The generated `ConversationWithTranslations['translations']` type collapses
	// to `{}` (the schema is too deeply nested for TS to infer), so we read the
	// runtime-validated shape through this narrow local type.
	const tx =
		conversation && 'translations' in conversation
			? (conversation.translations as { title?: TxField; description?: TxField })
			: null;
	const textContent = {
		title: fieldTarget(tx?.title),
		description: fieldTarget(tx?.description)
	};

	return { region, conversation, textContent };
};

type TxField = { textContent?: { id: string; primaryLocale: string } | null } | null;

/** Reduce a withTranslations field to the { id, locale } an edit is written to. */
function fieldTarget(field: TxField | undefined) {
	const tc = field?.textContent;
	return tc ? { id: tc.id, locale: tc.primaryLocale } : null;
}
