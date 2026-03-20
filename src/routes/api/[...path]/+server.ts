import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.API_URL || 'http://localhost:3000';

const handler: RequestHandler = async ({ request, params, cookies }) => {
	const path = params.path;
	const target = `${BACKEND_URL}/${path}`;

	const url = new URL(request.url);
	const fullTarget = url.search ? `${target}${url.search}` : target;

	const headers = new Headers();
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);

	const authToken = cookies.get('auth-token');
	if (authToken) {
		headers.set('cookie', `auth-token=${authToken}`);
	}

	const res = await fetch(fullTarget, {
		method: request.method,
		headers,
		body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined
	});

	const responseHeaders = new Headers();
	responseHeaders.set('content-type', res.headers.get('content-type') || 'application/json');

	// Parse and set cookies properly for same-origin (fixes Safari iOS)
	const setCookies = res.headers.getSetCookie?.() ?? [];
	for (const cookieHeader of setCookies) {
		// Parse cookie name and value
		const [nameValue, ...attributes] = cookieHeader.split(';').map(s => s.trim());
		const [name, value] = nameValue.split('=');

		// Extract relevant attributes
		let maxAge: number | undefined;
		let path = '/';
		let httpOnly = false;
		let secure = false;

		for (const attr of attributes) {
			const [key, val] = attr.split('=').map(s => s.trim());
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
