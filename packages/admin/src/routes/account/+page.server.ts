import { fail } from '@sveltejs/kit';
import { message, setError, superValidate, type Infer } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { apiStatus } from '$lib/api/describe-failure';
import { accountSchema, type AccountMessage } from './account-schema';
import type { Actions, PageServerLoad } from './$types';

type AccountForm = Infer<typeof accountSchema>;

export const load: PageServerLoad = async ({ locals }) => {
	const user = await locals.api.CurrentUser().catch(() => null);
	return {
		form: await superValidate<AccountForm, AccountMessage>(
			{ username: user?.username ?? '' },
			zod4(accountSchema),
			{
				errors: false
			}
		)
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate<AccountForm, AccountMessage>(request, zod4(accountSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await locals.api.UpdateUserDetails({ username: form.data.username });
		} catch (e) {
			// A taken username is not mapped by comhairle and comes back as a 500.
			if (apiStatus(e) !== undefined) {
				return setError(form, 'username', 'Could not use this username. It may already be taken.');
			}
			return message(
				form,
				{ kind: 'error', text: 'Could not save your username. Try again.' },
				{ status: 502 }
			);
		}
		return message(form, { kind: 'ok', text: 'Saved.' });
	}
};
