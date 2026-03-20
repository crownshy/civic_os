import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.API_URL || 'http://localhost:3000';

const handler: RequestHandler = async ({ request, params, cookies }) => {
	const path = params.path;
	// Backend API expects /api prefix
	const target = `${BACKEND_URL}/api/${path}`;

	const url = new URL(request.url);
	const fullTarget = url.search ? `${target}${url.search}` : target;

	console.log('[Proxy]', request.method, fullTarget);

	const headers = new Headers();
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);

	// Forward origin header so backend CORS accepts the request
	const origin = request.headers.get('origin') || url.origin;
	headers.set('origin', origin);

	const authToken = cookies.get('auth-token');
	if (authToken) {
		headers.set('cookie', `auth-token=${authToken}`);
	}

	const res = await fetch(fullTarget, {
		method: request.method,
		headers,
		body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined
	});

	console.log('[Proxy] Response:', res.status, res.statusText);

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

// Handle CORS preflight
export const OPTIONS: RequestHandler = async ({ request }) => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Max-Age': '86400'
		}
	});
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
