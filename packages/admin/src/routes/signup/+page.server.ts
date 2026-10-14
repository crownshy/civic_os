import { fail } from '@sveltejs/kit';
import { superValidate, message, setError, type Infer } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createBackendClient } from '$lib/server/backend-client';
import { apiStatus } from '$lib/api/describe-failure';
import { signupSchema, type SignupMessage } from './signup-schema';
import type { Actions, PageServerLoad } from './$types';

type SignupForm = Infer<typeof signupSchema>;

export const load: PageServerLoad = async () => {
	return { form: await superValidate<SignupForm, SignupMessage>(zod4(signupSchema)) };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate<SignupForm, SignupMessage>(request, zod4(signupSchema));
		const { username, email, password } = form.data;
		form.data.password = '';
		form.data.confirmPassword = '';
		if (!form.valid) return fail(400, { form });

		// comhairle signs the new account in and emails a verification link, but
		// the session is not kept: a new account has no Host yet, so admin would
		// only turn it away.
		try {
			await createBackendClient().SignUp({ username, email, password });
		} catch (e) {
			const status = apiStatus(e);
			if (status === 409)
				return setError(form, 'email', 'An account with this email already exists.');
			if (status === 400) return setError(form, 'password', 'Choose a stronger password.');
			// A taken username is not mapped by comhairle and comes back as a 500.
			if (status === 500) {
				return setError(form, 'username', 'Could not use this username. It may already be taken.');
			}
			if (status !== undefined) {
				return message(
					form,
					{ kind: 'error', text: 'Could not create your account. Try again in a moment.' },
					{ status: 502 }
				);
			}
			// No status means the reply arrived but failed schema validation, so the
			// account was created.
		}

		return message(form, {
			kind: 'created',
			text: `Account created. We sent a link to ${email} to confirm your email. Once someone adds you to a Host, you can sign in.`
		});
	}
};
