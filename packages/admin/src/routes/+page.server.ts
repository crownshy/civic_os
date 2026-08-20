import { createApiClient } from '$lib/api/client';
import type { PageServerLoad } from './$types';

/**
 * The Campaign list itself is loaded once in the root +layout.server.ts (the
 * sidebar reads the same list). Only the per-card event count is fetched here,
 * because nothing else needs it: `limit: 1` because we want `total`, not the
 * records.
 */
export const load: PageServerLoad = async ({ parent, cookies, url, depends }) => {
	depends('dashboard:event-counts');

	const { conversations } = await parent();
	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	const counts = await Promise.all(
		conversations.map((conversation) =>
			api
				.ListEvents({ params: { conversation_id: conversation.id }, queries: { limit: 1 } })
				.then((result) => result.total)
				.catch(() => 0)
		)
	);

	return {
		conversations: conversations.map((conversation, index) => ({
			...conversation,
			eventCount: counts[index]
		}))
	};
};
