import { redirect, type Handle } from '@sveltejs/kit';
import { createBackendClient } from '$lib/server/backend-client';
import { clearHostSession, ensureHostSession } from '$lib/server/host-session';
import { probeAdmin } from '$lib/server/admin-gate';

/**
 * SvelteKit mirrors every modulepreload into a `Link` response header. On the
 * deeper /c/[slug] pages that header alone passes 4KB, which overflows nginx's
 * default `proxy_buffer_size` and turns a full-page refresh into a 502 ("upstream
 * sent too big header"). The same preloads are already `<link>` tags in the
 * HTML head, so dropping the header costs nothing.
 */
async function withoutLinkHeader(response: Response | Promise<Response>) {
	const res = await response;
	if (res.headers.has('link')) res.headers.delete('link');
	return res;
}

const PUBLIC_PATHS = ['/login', '/logout', '/signup', '/welcome'];
const PUBLIC_PREFIXES = ['/api/auth/', '/_app/', '/favicon'];

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	const isPublic = PUBLIC_PATHS.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
	if (isPublic) return withoutLinkHeader(resolve(event));

	const authToken = event.cookies.get('auth-token');
	if (!authToken) throw redirect(303, '/login');

	// The user's cookie and nothing else: comhairle prefers a Bearer token over
	// the cookie, so a service key sent alongside would probe the key's owner.
	const result = await probeAdmin(createBackendClient(authToken));
	if (result === 'unauthorized') {
		event.cookies.delete('auth-token', { path: '/' });
		clearHostSession(event.cookies, event.url);
		throw redirect(303, '/login');
	}
	if (result === 'forbidden') {
		event.cookies.delete('auth-token', { path: '/' });
		clearHostSession(event.cookies, event.url);
		throw redirect(303, '/login?denied=1');
	}

	ensureHostSession(event.cookies, authToken, event.url);
	event.locals.isAdmin = true;
	return withoutLinkHeader(resolve(event));
};
