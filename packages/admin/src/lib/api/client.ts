import { createApiClient as createGeneratedClient } from '@crownshy/api-client/client';
import { begin } from '$lib/activity.svelte';

/**
 * `createApiClient` with the empty-body response normalised.
 *
 * Comhairle answers its write endpoints (`UpdateOrganizationMemberRole`,
 * `RemoveOrganizationMember`, `RevokePermission`, and 18 others) with HTTP 200,
 * a zero-length body and no `Content-Type`. Axios cannot parse that, so it hands
 * back `data: ''`. The generated schemas declare `response: z.void()`, and
 * `z.void()` rejects `''`, so zodios throws AFTER the write has already been
 * committed server-side.
 *
 * That is why changing a role or revoking access showed "Could not update role."
 * and then turned out to have worked on the next refresh: the request succeeded
 * and the response validation failed.
 *
 * An empty body means `undefined`, not the empty string, so this rewrites it
 * before zodios validates. Use this everywhere in admin instead of importing
 * `createApiClient` directly.
 */
export const createApiClient: typeof createGeneratedClient = (
	baseUrl,
	authToken,
	source,
	locale
) => {
	const api = createGeneratedClient(baseUrl, authToken, source, locale);

	api.axios.interceptors.response.use((response) => {
		if (response.data === '') response.data = undefined;
		return response;
	});

	// Writes show as busy until they settle. Reads are left out: they are either
	// part of a navigation, which reports itself, or background polling.
	if (source === 'client') {
		const ends = new WeakMap<object, () => void>();
		const settle = <T extends { config?: object }>(outcome: T) => {
			if (outcome?.config) ends.get(outcome.config)?.();
			return outcome;
		};
		api.axios.interceptors.request.use((config) => {
			if (config.method && config.method.toLowerCase() !== 'get') ends.set(config, begin());
			return config;
		});
		api.axios.interceptors.response.use(settle, (error) => Promise.reject(settle(error)));
	}

	return api;
};
