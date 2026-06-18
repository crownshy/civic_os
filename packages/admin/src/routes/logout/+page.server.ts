import { redirect, type Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.API_URL || 'http://localhost:3000';
const API_PREFIX = env.API_PREFIX || '';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const authToken = cookies.get('auth-token');
		if (authToken) {
			await fetch(`${BACKEND_URL}${API_PREFIX}/auth/logout`, {
				method: 'POST',
				headers: { cookie: `auth-token=${authToken}` }
			}).catch(() => {});
		}
		cookies.delete('auth-token', { path: '/' });
		throw redirect(303, '/login');
	}
};
