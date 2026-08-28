import { createApiClient } from '@crownshy/api-client/client';
import type { LayoutServerLoad } from './$types';
import { resolveHostCopy, type ConversationCopy } from '$lib/config/host-copy';

export const load: LayoutServerLoad = async ({ locals, url, depends }) => {
	const region = locals.region;

	// Admin edits this copy in real time, so it needs a key an invalidation can
	// target rather than relying on a full reload.
	depends('civicos:conversation');

	// This runs server-side rather than in `+layout.ts` because the universal
	// load returns the api client, which cannot be serialized, so SvelteKit
	// re-runs it on hydration. Fetching there would cost two requests per first
	// paint. `hostCopy` is plain strings, so it transports.
	let conversation: ConversationCopy | null = null;
	if (region.conversationId) {
		const api = createApiClient(`${url.origin}/api`, undefined, 'server');
		try {
			conversation = await api.GetConversation({
				params: { conversation_id: region.conversationId }
			});
		} catch (e) {
			// A Campaign that is unreachable, unpublished, or simply absent from
			// this backend must not take the landing page down with it: the region
			// defaults cover every field this app reads.
			console.warn('[HostCopy] Conversation unavailable, using region defaults:', e);
		}
	}

	return {
		region,
		hostCopy: resolveHostCopy(conversation, region)
	};
};
