import { createApiClient } from '@crownshy/api-client/client';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url, data, depends }) => {
	// Re-run this load (and rebuild the api client) when the session changes,
	// e.g. after login/logout call `invalidate('app:auth')`.
	depends('app:auth');

	// In the browser the api client authenticates via the cookie jar through the
	// /api proxy, so no token is needed. During SSR there is no cookie jar, so we
	// pass the httpOnly auth-token surfaced by +layout.server.ts.
	const authToken = browser ? undefined : data?.authToken;
	const api = createApiClient(url.origin + '/api', authToken, browser ? 'client' : 'server');

	return { api };
};
