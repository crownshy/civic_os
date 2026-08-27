import { redirect, type Handle } from '@sveltejs/kit';
import { createBackendClient, serviceKeyHeader } from '$lib/server/backend-client';

const PUBLIC_PATHS = ['/login', '/logout'];
const PUBLIC_PREFIXES = ['/api/auth/', '/_app/', '/favicon'];

/**
 * Probe an admin-gated comhairle endpoint with the user's cookie.
 * 200 → user is an admin. 401 → no/expired session. 403 → logged in but not admin.
 *
 * Only the status decides, never the body, so a reply that arrives but fails
 * schema validation still counts as admin: drift between the generated client
 * and `/regions` must not lock every admin out of the app. A request that never
 * reached the server rethrows, which is what the raw-fetch version did.
 *
 * `limit: 1` because this runs on every non-public request and the payload is
 * thrown away; the raw-fetch version never read the body at all.
 */
async function probeAdmin(authToken: string): Promise<'admin' | 'unauthorized' | 'forbidden'> {
	const api = createBackendClient(authToken);

	try {
		await api.ListRegions({ queries: { limit: 1 }, headers: serviceKeyHeader() });
		return 'admin';
	} catch (e) {
		const err = e as {
			response?: { status?: number };
			cause?: { issues?: unknown[] };
			issues?: unknown[];
		};

		if (Array.isArray(err.issues) || Array.isArray(err.cause?.issues)) return 'admin';

		const status = err.response?.status;
		if (status === undefined) throw e;
		if (status === 403) return 'forbidden';
		return 'unauthorized';
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	const isPublic = PUBLIC_PATHS.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
	if (isPublic) return resolve(event);

	const authToken = event.cookies.get('auth-token');
	if (!authToken) throw redirect(303, '/login');

	const result = await probeAdmin(authToken);
	if (result === 'unauthorized') {
		event.cookies.delete('auth-token', { path: '/' });
		throw redirect(303, '/login');
	}
	if (result === 'forbidden') {
		event.cookies.delete('auth-token', { path: '/' });
		throw redirect(303, '/login?denied=1');
	}

	event.locals.isAdmin = true;
	return resolve(event);
};
