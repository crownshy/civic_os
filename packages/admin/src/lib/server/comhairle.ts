import { env } from '$env/dynamic/private';

const BACKEND_URL = env.API_URL || 'http://localhost:3000';
const API_PREFIX = env.API_PREFIX || '';

/** Server-side fetch against comhairle, forwarding the admin's auth cookie. */
export async function comhairleFetch(
	path: string,
	authToken: string | undefined,
	init?: RequestInit
): Promise<Response> {
	const headers = new Headers(init?.headers);
	if (authToken) headers.set('cookie', `auth-token=${authToken}`);
	if (env.COMHAIRLE_API_KEY) headers.set('Authorization', `Bearer ${env.COMHAIRLE_API_KEY}`);
	return fetch(`${BACKEND_URL}${API_PREFIX}${path}`, { ...init, headers });
}