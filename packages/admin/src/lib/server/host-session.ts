import type { Cookies } from '@sveltejs/kit';
import { HOST_SESSION_COOKIE } from '@civicos/shared/data/host-session';
import { participantBase } from '$lib/conversations';

/**
 * The domain both apps sit under, so a cookie set here reaches the participant
 * site too: `adminstage.bloomproject.us` and `stage.bloomproject.us` give
 * `.bloomproject.us`. Undefined, a cookie for admin's own host, on localhost,
 * where cookies ignore the port and already reach both, or when the two share
 * no registrable domain.
 */
export function sharedCookieDomain(adminHost: string, participantHost: string) {
	const labels = (host: string) =>
		host
			.replace(/^https?:\/\//, '')
			.replace(/[:/].*$/, '')
			.toLowerCase()
			.split('.')
			.reverse();
	const admin = labels(adminHost);
	const participant = labels(participantHost);
	if (!participantHost || isLocal(admin) || isLocal(participant)) return undefined;

	const shared: string[] = [];
	while (shared.length < admin.length && admin[shared.length] === participant[shared.length]) {
		shared.push(admin[shared.length]);
	}
	return shared.length >= 2 ? `.${shared.reverse().join('.')}` : undefined;
}

function isLocal(labels: string[]) {
	return labels[0] === 'localhost' || labels.every((l) => /^\d+$/.test(l));
}

const domainFor = (adminHost: string) => sharedCookieDomain(adminHost, participantBase());

/** Copy admin's session to the cookie civicos reads for draft previews. */
export function setHostSession(
	cookies: Pick<Cookies, 'set'>,
	token: string,
	{ adminHost, maxAge, secure }: { adminHost: string; maxAge?: number; secure: boolean }
) {
	cookies.set(HOST_SESSION_COOKIE, token, {
		path: '/',
		domain: domainFor(adminHost),
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
	setHostSession(cookies, token, { adminHost: url.host, secure: url.protocol === 'https:' });
}

export function clearHostSession(cookies: Pick<Cookies, 'delete'>, url: URL) {
	cookies.delete(HOST_SESSION_COOKIE, { path: '/', domain: domainFor(url.host) });
}
