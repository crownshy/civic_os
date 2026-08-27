import { fail, redirect, type Actions } from '@sveltejs/kit';
import { createBackendClient } from '$lib/server/backend-client';
import { forwardAuthCookie, setCookiesOf } from '$lib/server/auth-cookie';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: 'Email and password are required.' });
		}

		const api = createBackendClient();

		// The session arrives as a `Set-Cookie` header, and the client hands back
		// the parsed body rather than the response, so catch the headers on the
		// way through.
		let setCookies: string[] = [];
		api.axios.interceptors.response.use((res) => {
			setCookies = setCookiesOf(res.headers);
			return res;
		});

		try {
			await api.LoginUser({ email, password });
		} catch {
			// A reply that arrived but failed to validate still signed us in, and
			// the interceptor above already holds the cookie. Only a rejected login,
			// or a request that never landed, is a real failure.
			if (!setCookies.length) {
				return fail(401, { email, error: 'Invalid email or password.' });
			}
		}

		for (const setCookie of setCookies) {
			forwardAuthCookie(setCookie, cookies);
		}

		throw redirect(303, '/');
	}
};
