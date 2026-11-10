import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * The profile belongs to whoever the cookie names. Nobody signed in has no
 * profile to show, so they go to the directory. A backend that could not
 * answer is not "nobody", so the page renders with what it has.
 */
export const load: PageLoad = async ({ parent }) => {
	const { participant, participantResolved } = await parent();
	if (participantResolved && !participant) redirect(302, '/');
	return { participant };
};
