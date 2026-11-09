import { createApiClient as createGeneratedClient } from '@crownshy/api-client/client';

export type Api = ReturnType<typeof createGeneratedClient>;

/**
 * `createApiClient` with the empty-body response normalised. Use this in both
 * apps instead of importing the generated one.
 *
 * Comhairle answers many write endpoints (`RemoveOrganizationMember`,
 * `RevokePermission`, ...) with HTTP 200 and a zero-length body, which axios
 * hands back as `data: ''`. The generated schemas declare `z.void()`, which
 * rejects `''`, so zodios throws AFTER the write has committed and the UI
 * reports a failure that did not happen.
 */
export const createApiClient: typeof createGeneratedClient = (...args) => {
	const api = createGeneratedClient(...args);
	api.axios.interceptors.response.use((response) => {
		if (response.data === '') response.data = undefined;
		return response;
	});
	// A server-side call must fail on a redirect, never follow it. On Node, axios
	// follows a 3xx and keeps the cookie on the same host, so a 303 to /login
	// from the admin gate turned into a render of /login, whose loads called the
	// backend again and were redirected again: one throttled call fanned out
	// without bound until the api pod went down.
	if (args[2] === 'server') api.axios.defaults.maxRedirects = 0;
	return api;
};

/** A server-side client through this app's own `/api` proxy. */
export function serverApi(url: URL, authToken?: string): Api {
	return createApiClient(`${url.origin}/api`, authToken, 'server');
}
