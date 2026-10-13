import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { HOST_SESSION_COOKIE } from '@civicos/shared/data/host-session';

/**
 * The parent domain admin and civicos share, e.g. `.bloomproject.us`. Unset
 * locally, where a host-only cookie already reaches both apps: cookies ignore
 * the port, so `localhost:5174` and `localhost:5173` see the same jar.
 */
const domain = () => env.SESSION_COOKIE_DOMAIN || undefined;

/** Copy admin's session to the cookie civicos reads for draft previews. */
export function setHostSession(
	cookies: Pick<Cookies, 'set'>,
	token: string,
	{ maxAge, secure }: { maxAge?: number; secure: boolean }
) {
	cookies.set(HOST_SESSION_COOKIE, token, {
		path: '/',
		domain: domain(),
		maxAge,
		secure,
		httpOnly: true,
		sameSite: 'lax'
	});
}

/**
 * Copy a session that predates the host-session cookie, so a Host who signed in
 * before it existed can preview without signing in again. No max-age is known
 * here, so it lasts the browser session; the next login or refresh replaces it.
 */
export function ensureHostSession(cookies: Pick<Cookies, 'get' | 'set'>, token: string, url: URL) {
	if (cookies.get(HOST_SESSION_COOKIE) === token) return;
	setHostSession(cookies, token, { secure: url.protocol === 'https:' });
}

export function clearHostSession(cookies: Pick<Cookies, 'delete'>) {
	cookies.delete(HOST_SESSION_COOKIE, { path: '/', domain: domain() });
}
