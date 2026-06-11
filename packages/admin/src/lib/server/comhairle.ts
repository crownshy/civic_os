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

export interface LocalizedConversation {
	id: string;
	title: string;
	short_description: string;
	description: string;
	image_url: string;
	tags: string[];
	is_public: boolean;
	is_live: boolean;
	is_complete: boolean;
	is_invite_only: boolean;
	slug: string | null;
	primary_locale: string;
}

export async function fetchConversation(
	conversationId: string,
	authToken: string | undefined
): Promise<LocalizedConversation | null> {
	const res = await comhairleFetch(`/conversations/${conversationId}`, authToken).catch(() => null);
	if (!res || !res.ok) return null;
	return (await res.json()) as LocalizedConversation;
}
