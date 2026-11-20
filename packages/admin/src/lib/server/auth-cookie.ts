import type { Cookies } from '@sveltejs/kit';
import { setSession } from './session';
import type { createBackendClient } from './backend-client';

type BackendClient = ReturnType<typeof createBackendClient>;

/**
 * Re-issue comhairle's `auth-token` cookie as the shared session cookie.
 *
 * comhairle returns the session in a `Set-Cookie` header scoped to its own
 * origin, so the header cannot simply be passed through: the attributes are
 * re-read and the session is set again by SvelteKit. `SameSite` is forced to
 * `lax` because comhairle's `None` would need `Secure` and is refused by Safari
 * over plain http in dev.
 *
 * Anything that is not comhairle's `auth-token` cookie is ignored.
 */
export function forwardAuthCookie(
	setCookie: string,
	cookies: Pick<Cookies, 'set'>,
	adminHost: string
): boolean {
	const [nameValue, ...attrs] = setCookie.split(';').map((s) => s.trim());
	const [name, value] = nameValue.split('=');
	if (name !== 'auth-token') return false;

	let maxAge: number | undefined;
	let secure = false;
	for (const a of attrs) {
		const [k, v] = a.split('=').map((s) => s.trim());
		const lk = k.toLowerCase();
		if (lk === 'max-age' && v) maxAge = parseInt(v);
		else if (lk === 'secure') secure = true;
	}

	setSession(cookies, value, { adminHost, maxAge, secure });
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
