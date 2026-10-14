import { fail, redirect, type Cookies } from '@sveltejs/kit';
import { superValidate, message, setError, type Infer } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createBackendClient } from '$lib/server/backend-client';
import { captureSetCookies, forwardAuthCookie } from '$lib/server/auth-cookie';
import { isExpired, readEmailLinkToken } from '$lib/server/email-link-token';
import { apiStatus } from '$lib/api/describe-failure';
import { welcomeSchema, type WelcomeMessage } from './welcome-schema';
import type { Actions, PageServerLoad } from './$types';

type WelcomeForm = Infer<typeof welcomeSchema>;

/** Why the link cannot be used, or null when it looks usable. */
type LinkProblem = 'missing' | 'invalid' | 'expired' | null;

function inspectLink(url: URL) {
	const token = url.searchParams.get('token');
	if (!token) return { token: null, email: null, problem: 'missing' as LinkProblem };
	const claims = readEmailLinkToken(token);
	if (!claims) return { token, email: null, problem: 'invalid' as LinkProblem };
	const problem: LinkProblem = isExpired(claims) ? 'expired' : null;
	return { token, email: claims.email, problem };
}

export const load: PageServerLoad = async ({ url }) => {
	const { email, problem } = inspectLink(url);
	return {
		email,
		linkProblem: problem,
		form: await superValidate<WelcomeForm, WelcomeMessage>(zod4(welcomeSchema))
	};
};

/**
 * Sign in with the invite token, or with the new password if the token was
 * already spent on an earlier attempt. `VerifyEmailToken` also marks the email
 * verified, which a password reset alone leaves false.
 */
async function signIn(
	token: string,
	email: string | null,
	password: string,
	cookies: Cookies,
	adminHost: string
) {
	const api = createBackendClient();
	const setCookies = captureSetCookies(api);

	await api.VerifyEmailToken({ token }).catch(() => {});
	if (!setCookies().length && email) {
		await api.LoginUser({ email, password }).catch(() => {});
	}

	for (const setCookie of setCookies()) forwardAuthCookie(setCookie, cookies, adminHost);
	return cookies.get('auth-token') ?? null;
}

export const actions: Actions = {
	/**
	 * Every step can be repeated, so a taken username or a dropped request can be
	 * retried with the same link: the password reset takes the same token again,
	 * and signing in falls back to email and password once the token has verified.
	 */
	default: async ({ request, url, cookies }) => {
		const form = await superValidate<WelcomeForm, WelcomeMessage>(request, zod4(welcomeSchema));
		const { username, password, confirmPassword } = form.data;
		form.data.password = '';
		form.data.confirmPassword = '';
		if (!form.valid) return fail(400, { form });

		const { token, email, problem } = inspectLink(url);
		if (!token || problem) {
			return message(form, 'This link no longer works. Ask whoever added you to send a new one.', {
				status: 400
			});
		}

		try {
			await createBackendClient().PasswordResetUpdate({
				token,
				password,
				confirm_password: confirmPassword
			});
		} catch (e) {
			const status = apiStatus(e);
			if (status === 400) return setError(form, 'password', 'Choose a stronger password.');
			if (status !== undefined) {
				return message(
					form,
					'This link no longer works. Ask whoever added you to send a new one.',
					{ status: 400 }
				);
			}
		}

		const authToken = await signIn(token, email, password, cookies, url.host);
		if (!authToken) {
			return message(
				form,
				'Your password is saved, but we could not sign you in. Sign in with your email and new password.',
				{ status: 502 }
			);
		}

		try {
			await createBackendClient(authToken).UpdateUserDetails({ username });
		} catch (e) {
			if (apiStatus(e) !== undefined) {
				// A taken username is not mapped by comhairle and comes back as a 500.
				return setError(form, 'username', 'Could not use this username. It may already be taken.');
			}
		}

		throw redirect(303, '/');
	}
};
