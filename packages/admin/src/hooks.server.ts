import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const PUBLIC_PATHS = ['/login', '/logout'];
const PUBLIC_PREFIXES = ['/api/auth/', '/_app/', '/favicon'];

const BACKEND_URL = env.API_URL || 'http://localhost:3000';
const API_PREFIX = env.API_PREFIX || '';

/**
 * Probe an admin-gated comhairle endpoint with the user's cookie.
 * 200 → user is an admin. 401 → no/expired session. 403 → logged in but not admin.
 */
async function probeAdmin(authToken: string): Promise<'admin' | 'unauthorized' | 'forbidden'> {
	const headers = new Headers({ cookie: `auth-token=${authToken}` });
	if (env.COMHAIRLE_API_KEY) headers.set('Authorization', `Bearer ${env.COMHAIRLE_API_KEY}`);

	const res = await fetch(`${BACKEND_URL}${API_PREFIX}/regions`, { headers });
	if (res.status === 200) return 'admin';
	if (res.status === 403) return 'forbidden';
	return 'unauthorized';
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	const isPublic =
		PUBLIC_PATHS.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
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
