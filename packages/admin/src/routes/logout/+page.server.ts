import { redirect, type Actions } from '@sveltejs/kit';
import { createBackendClient } from '$lib/server/backend-client';
import { clearSession, readSession } from '$lib/server/session';

export const actions: Actions = {
	default: async ({ cookies, url }) => {
		const authToken = readSession(cookies);
		if (authToken) {
			// Best effort: the local cookie goes either way, so a backend that is
			// down or a reply that fails validation must not block signing out.
			await createBackendClient(authToken)
				.LogoutUser(undefined, {})
				.catch(() => {});
		}
		clearSession(cookies, url);
		throw redirect(303, '/login');
	}
};
