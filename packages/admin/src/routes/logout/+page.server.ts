import { redirect, type Actions } from '@sveltejs/kit';
import { createBackendClient } from '$lib/server/backend-client';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const authToken = cookies.get('auth-token');
		if (authToken) {
			// Best effort: the local cookie goes either way, so a backend that is
			// down or a reply that fails validation must not block signing out.
			await createBackendClient(authToken)
				.LogoutUser(undefined, {})
				.catch(() => {});
		}
		cookies.delete('auth-token', { path: '/' });
		throw redirect(303, '/login');
	}
};
