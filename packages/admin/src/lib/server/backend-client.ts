import { env } from '$env/dynamic/private';
import { createApiClient } from '$lib/api/client';

const BACKEND_URL = env.API_URL || 'http://localhost:3000';
const API_PREFIX = env.API_PREFIX || '';

/**
 * An api client pointed straight at comhairle instead of at the `/api` proxy.
 *
 * Everything else in admin goes through the proxy, and should. Auth cannot:
 * comhairle returns the session in a `Set-Cookie` header on login, and the
 * proxy consumes those headers into its own request's cookie jar rather than
 * passing them back (see routes/api/[...path]/+server.ts), so a login routed
 * through it would drop the session on the floor. The `handle` hook is direct
 * for a different reason: calling our own proxy from inside `handle`, on every
 * request, would be a needless round trip through the server that is already
 * handling the request.
 *
 * Server-only. Nothing under `$lib/server` is reachable from the browser.
 */
export function createBackendClient(authToken?: string) {
	return createApiClient(`${BACKEND_URL}${API_PREFIX}`, authToken, 'server');
}

/**
 * The service key that admin-gated calls send alongside the user's cookie.
 * Undefined when unset, which is the normal local-dev case.
 */
export function serviceKeyHeader(): Record<string, string> | undefined {
	return env.COMHAIRLE_API_KEY ? { Authorization: `Bearer ${env.COMHAIRLE_API_KEY}` } : undefined;
}
