import { fail, redirect, type Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.API_URL || 'http://localhost:3000';
const API_PREFIX = env.API_PREFIX || '';

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: 'Email and password are required.' });
		}

		const loginRes = await fetch(`${BACKEND_URL}${API_PREFIX}/auth/login`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		if (!loginRes.ok) {
			return fail(401, { email, error: 'Invalid email or password.' });
		}

		// Forward auth-token cookie set by comhairle to the browser (same-origin).
		for (const cookieHeader of loginRes.headers.getSetCookie?.() ?? []) {
			const [nameValue, ...attrs] = cookieHeader.split(';').map((s) => s.trim());
			const [name, value] = nameValue.split('=');
			if (name !== 'auth-token') continue;

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
		}

		throw redirect(303, '/');
	}
};
