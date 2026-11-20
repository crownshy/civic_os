import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { clearHostSession, setHostSession, sharedDomainFor } from './host-session';

export function sessionCookieName() {
	return env.SESSION_COOKIE_NAME || 'bloom-session';
}

export function readSession(cookies: Pick<Cookies, 'get'>) {
	return cookies.get(sessionCookieName());
}

export function setSession(
	cookies: Pick<Cookies, 'set'>,
	token: string,
	{ adminHost, maxAge, secure }: { adminHost: string; maxAge?: number; secure: boolean }
) {
	cookies.set(sessionCookieName(), token, {
		path: '/',
		domain: sharedDomainFor(adminHost),
		maxAge,
		secure,
		httpOnly: true,
		sameSite: 'lax'
	});
	setHostSession(cookies, token, { adminHost, maxAge, secure });
}

export function clearSession(cookies: Pick<Cookies, 'delete'>, url: URL) {
	cookies.delete(sessionCookieName(), { path: '/', domain: sharedDomainFor(url.host) });
	clearHostSession(cookies, url);
}
