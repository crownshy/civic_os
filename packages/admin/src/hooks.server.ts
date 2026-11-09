import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { createBackendClient } from '$lib/server/backend-client';
import { clearHostSession, ensureHostSession } from '$lib/server/host-session';
import { createAdminCache, probeAdmin } from '$lib/server/admin-gate';

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
const PUBLIC_PREFIXES = ['/_app/', '/favicon'];

const adminCache = createAdminCache();

function clientAddress(event: RequestEvent) {
	const forwarded = event.request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded;
	try {
		return event.getClientAddress();
	} catch {
		return null;
	}
}

function once<T>(fn: () => Promise<T>): () => Promise<T> {
	let pending: Promise<T> | undefined;
	return () => (pending ??= fn());
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// The proxy only forwards the caller's cookie, and comhairle checks every call
	// itself, so gating it as well cost two extra comhairle calls per request.
	if (path.startsWith('/api/')) return resolve(event);

	// The user's cookie and nothing else: comhairle prefers a Bearer token over
	// the cookie, so a service key sent alongside would act as the key's owner.
	const authToken = event.cookies.get('auth-token');
	const api = createBackendClient(authToken, clientAddress(event));
	event.locals.api = api;
	// The gate and the root layout both need this; one request asks comhairle once.
	event.locals.userOrganizations = once(() => api.GetUserOrganizations());

	const isPublic = PUBLIC_PATHS.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
	if (isPublic) return withoutLinkHeader(resolve(event));

	if (!authToken) throw redirect(303, '/login');

	if (!adminCache.has(authToken)) {
		const result = await probeAdmin({
			ListRegions: (config) => api.ListRegions(config),
			GetUserOrganizations: () => event.locals.userOrganizations()
		});
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
		adminCache.remember(authToken);
	}

	ensureHostSession(event.cookies, authToken, event.url);
	event.locals.isAdmin = true;
	return withoutLinkHeader(resolve(event));
};
