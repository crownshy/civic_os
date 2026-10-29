import { createApiClient as createSharedClient } from '@civicos/shared/api';
import { begin } from '$lib/activity.svelte';

/**
 * The shared client plus admin's busy indicator. Use this for the browser
 * client; server loads can call `serverApi` from `@civicos/shared/api`.
 */
export const createApiClient: typeof createSharedClient = (...args) => {
	const api = createSharedClient(...args);

	// Writes show as busy until they settle. Reads are left out: they are either
	// part of a navigation, which reports itself, or background polling.
	if (args[2] === 'client') {
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
