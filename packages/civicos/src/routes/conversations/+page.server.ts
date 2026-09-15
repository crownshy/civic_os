import { createApiClient } from '@crownshy/api-client/client';
import { toDirectory } from '$lib/config/directory';
import { apexHost } from '$lib/config/place';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, depends }) => {
	// A Host publishing a Campaign changes this list, so it needs a key an
	// invalidation can target.
	depends('civicos:directory');

	// Server-side and anonymous, like every other participant read: the proxy
	// forwards no token and `GET /conversation` does not want one.
	const api = createApiClient(`${url.origin}/api`, undefined, 'server');

	const conversations = await api
		.ListConverastions({ queries: { limit: 100 } })
		.then((result) => result.records)
		.catch((e) => {
			console.warn('[directory] ListConverastions failed', e);
			return null;
		});

	return {
		// `null` is "we could not ask", `[]` is "nothing is running", and the page
		// says different things for the two. This is where a 404 sends people, so
		// it must not 500 on top of the error that got them here.
		campaigns: conversations && toDirectory(conversations, apexHost(url.host))
	};
};
