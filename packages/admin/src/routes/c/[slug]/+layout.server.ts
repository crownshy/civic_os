import { error } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import { getCampaign } from '$lib/api/campaigns';
import type { Campaign } from '$lib/types/campaign';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, cookies, url, depends }) => {
	depends(`campaign:${params.slug}`);

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	// getCampaign fetches the Conversation withTranslations, which (admin only)
	// returns the resolved display strings *and* each text field's TextContent id +
	// locale. Those ids are what edits are written against: Conversation
	// title/description are TextContentId (UUID) references, not text columns, so
	// they can only be edited via the translations endpoints. See #391.
	let campaign: Campaign | null = null;
	let campaignError: string | null = null;
	try {
		campaign = await getCampaign(api, params.slug);
	} catch (e) {
		campaignError = e instanceof Error ? e.message : String(e);
		console.warn('getCampaign failed', campaignError);
	}

	// No region carries this official_id and the API answered — a bad URL, not a
	// failure. Everything else renders an error state rather than a 404.
	if (!campaign && !campaignError) {
		error(404, `Unknown conversation: ${params.slug}`);
	}

	const conversation = campaign?.conversation ?? null;

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

	return { campaign, campaignError, conversation, textContent };
};

type TxField = { textContent?: { id: string; primaryLocale: string } | null } | null;

/** Reduce a withTranslations field to the { id, locale } an edit is written to. */
function fieldTarget(field: TxField | undefined) {
	const tc = field?.textContent;
	return tc ? { id: tc.id, locale: tc.primaryLocale } : null;
}
