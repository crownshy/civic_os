import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { forwardAuthCookie } from '$lib/server/auth-cookie';
import { readSession } from '$lib/server/session';

export const trailingSlash = 'ignore';

//TODO: THIS STUFF SHOULD GO AWAY (me thinks)
const BACKEND_URL = env.API_URL || 'http://localhost:3000';
// In production, set API_PREFIX=/api so requests go to e.g. bloom.comhairle.scot/api/auth/...
// Locally, the backend serves routes at the root (e.g. /auth/...), so leave this empty.
const API_PREFIX = env.API_PREFIX || '';

const SAFE_METHODS = ['GET', 'HEAD'];

const handler: RequestHandler = async ({ request, params, cookies }) => {
	const url = new URL(request.url);

    // Pages on our other subdomains can make the browser send the shared session
    // cookie here, so refuse writes from any origin but our own.
	const requestOrigin = request.headers.get('origin');
	if (!SAFE_METHODS.includes(request.method) && requestOrigin && requestOrigin !== url.origin) {
		return new Response(null, { status: 403 });
	}

	const path = params.path;
	const target = `${BACKEND_URL}${API_PREFIX}/${path}`;

	const fullTarget = url.search ? `${target}${url.search}` : target;

	const headers = new Headers();
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);

	// Forward origin header so backend CORS accepts the request
	headers.set('origin', requestOrigin || url.origin);

	//TODO: THIS STUFF SHOULD GO AWAY (me thinks)

	// Forward client IP so backend rate limiter (tower_governor) can identify the client.
	// In dev we fall back to 127.0.0.1 since there's no upstream proxy setting the header.
	// In production we only forward what the proxy gave us — never fabricate an IP.
	const forwardedFor = request.headers.get('x-forwarded-for') ?? (dev ? '127.0.0.1' : null);
	if (forwardedFor) {
		headers.set('x-forwarded-for', forwardedFor);
		headers.set('x-real-ip', forwardedFor.split(',')[0].trim());
	}

	// Cookie only, no service key: comhairle reads a bearer token before the
	// cookie, so a key here would act as its owner rather than as this user.
	const authToken = readSession(cookies);
	if (authToken) {
		headers.set('cookie', `auth-token=${authToken}`);
	}

	// Raw fetch by definition: this route is the proxy the api client calls
	// through, so it cannot call the client itself.
	const res = await fetch(fullTarget, {
		method: request.method,
		headers,
		body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined
	});

	const responseHeaders = new Headers();
	responseHeaders.set('content-type', res.headers.get('content-type') || 'application/json');

	// Parse and set cookies properly for same-origin (fixes Safari iOS)

	// MG: Can this loop be removed? Do we need to pass along every Comhairle cookie?
	const setCookies = res.headers.getSetCookie?.() ?? [];
	for (const cookieHeader of setCookies) {
		// Special handling for the auth-token cookie, as it gets set on the parent domain, not the admin host
		if (forwardAuthCookie(cookieHeader, cookies, url.host)) continue;

		// Parse cookie name and value
		const [nameValue, ...attributes] = cookieHeader.split(';').map((s) => s.trim());
		const [name, value] = nameValue.split('=');

		// Extract relevant attributes
		let maxAge: number | undefined;
		let path = '/';
		let httpOnly = false;
		let secure = false;

		for (const attr of attributes) {
			const [key, val] = attr.split('=').map((s) => s.trim());
			const lowerKey = key.toLowerCase();

			if (lowerKey === 'max-age' && val) {
				maxAge = parseInt(val);
			} else if (lowerKey === 'path' && val) {
				path = val;
			} else if (lowerKey === 'httponly') {
				httpOnly = true;
			} else if (lowerKey === 'secure') {
				secure = true;
			}
			// Ignore SameSite, Domain, etc. - let SvelteKit handle them for same-origin
		}

		// Use SvelteKit's cookies API to set same-origin cookies
		cookies.set(name, value, {
			path,
			httpOnly,
			secure,
			maxAge,
			sameSite: 'lax' // Use Lax for same-origin (Safari iOS friendly)
		});
	}

	return new Response(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers: responseHeaders
	});
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
