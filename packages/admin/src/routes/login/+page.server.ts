import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createBackendClient } from '$lib/server/backend-client';
import { forwardAuthCookie, setCookiesOf } from '$lib/server/auth-cookie';
import { loginSchema } from './login-schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { form: await superValidate(zod4(loginSchema)) };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(loginSchema));
		const { email, password } = form.data;
		// Never echo the password back to the page.
		form.data.password = '';
		if (!form.valid) return fail(400, { form });

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
				return message(form, 'Invalid email or password.', { status: 401 });
			}
		}

		for (const setCookie of setCookies) {
			forwardAuthCookie(setCookie, cookies);
		}

		throw redirect(303, '/');
	}
};
