import type { Cookies } from '@sveltejs/kit';

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
 * Anything that is not the `auth-token` cookie is ignored.
 */
export function forwardAuthCookie(setCookie: string, cookies: Cookies): boolean {
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
	return true;
}

/** The `Set-Cookie` headers on an axios response, normalised to an array. */
export function setCookiesOf(headers: { 'set-cookie'?: unknown }): string[] {
	const raw = headers['set-cookie'];
	if (Array.isArray(raw)) return raw.map(String);
	return raw ? [String(raw)] : [];
}
