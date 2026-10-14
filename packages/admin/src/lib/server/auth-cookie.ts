import type { Cookies } from '@sveltejs/kit';
import { setHostSession } from './host-session';
import type { createBackendClient } from './backend-client';

type BackendClient = ReturnType<typeof createBackendClient>;

/**
 * Re-issue comhairle's `auth-token` cookie as a same-origin one.
 *
 * comhairle returns the session in a `Set-Cookie` header scoped to its own
 * origin. Admin is served from a different one, so the header cannot simply be
 * passed through: the attributes are re-read and the cookie is set again by
 * SvelteKit. `SameSite` is forced to `lax` because the re-issued cookie is
 * same-origin, where comhairle's `None` would need `Secure` and is refused by
 * Safari over plain http in dev.
 *
 * Anything that is not the `auth-token` cookie is ignored. The session is also
 * copied to the host-session cookie, so the Host can preview a draft on civicos.
 */
export function forwardAuthCookie(setCookie: string, cookies: Cookies, adminHost: string): boolean {
	const [nameValue, ...attrs] = setCookie.split(';').map((s) => s.trim());
	const [name, value] = nameValue.split('=');
	if (name !== 'auth-token') return false;

	let maxAge: number | undefined;
	let secure = false;
	let httpOnly = false;
	for (const a of attrs) {
		const [k, v] = a.split('=').map((s) => s.trim());
		const lk = k.toLowerCase();
		if (lk === 'max-age' && v) maxAge = parseInt(v);
		else if (lk === 'secure') secure = true;
		else if (lk === 'httponly') httpOnly = true;
	}

	cookies.set(name, value, { path: '/', maxAge, secure, httpOnly, sameSite: 'lax' });
	setHostSession(cookies, value, { adminHost, maxAge, secure });
	return true;
}

/**
 * Collect the `Set-Cookie` headers from every successful response `api` gets.
 *
 * comhairle hands the session back as a cookie, and the generated client returns
 * the parsed body rather than the response, so the headers have to be caught on
 * the way through. Read the result after the call settles: a reply that arrived
 * but failed schema validation still carries the session.
 */
export function captureSetCookies(api: BackendClient): () => string[] {
	let collected: string[] = [];
	api.axios.interceptors.response.use((res) => {
		collected = [...collected, ...setCookiesOf(res.headers)];
		return res;
	});
	return () => collected;
}

/** The `Set-Cookie` headers on an axios response, normalised to an array. */
export function setCookiesOf(headers: { 'set-cookie'?: unknown }): string[] {
	const raw = headers['set-cookie'];
	if (Array.isArray(raw)) return raw.map(String);
	return raw ? [String(raw)] : [];
}
