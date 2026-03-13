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

	const setCookies = res.headers.getSetCookie?.() ?? [];
	for (const cookie of setCookies) {
		responseHeaders.append('set-cookie', cookie);
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
