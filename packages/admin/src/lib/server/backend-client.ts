import { env } from '$env/dynamic/private';
import { createApiClient } from '$lib/api/client';

const BACKEND_URL = env.API_URL || 'http://localhost:3000';
const API_PREFIX = env.API_PREFIX || '';

/**
 * An api client pointed straight at comhairle instead of at the `/api` proxy.
 *
 * Only the browser needs the proxy. Server code used to call this app's own
 * public `/api` URL, so every backend read left the pod, came back in through
 * the ingress and ran the admin gate again: one Campaign page cost about forty
 * comhairle requests. Server loads and actions read `locals.api`, one of these
 * built per request in `hooks.server.ts`.
 *
 * `forwardedFor` is the browser's address, passed on so comhairle's rate
 * limiter counts the person and not this pod.
 *
 * Server-only. Nothing under `$lib/server` is reachable from the browser.
 */
export function createBackendClient(authToken?: string, forwardedFor?: string | null) {
	const api = createApiClient(`${BACKEND_URL}${API_PREFIX}`, authToken, 'server');
	if (forwardedFor) {
		api.axios.defaults.headers.common['x-forwarded-for'] = forwardedFor;
		api.axios.defaults.headers.common['x-real-ip'] = forwardedFor.split(',')[0].trim();
	}
	return api;
}

export type BackendClient = ReturnType<typeof createBackendClient>;
