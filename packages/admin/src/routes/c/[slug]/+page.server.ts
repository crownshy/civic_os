import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// /c/[slug] redirects to Events tab (the only live tab today).
export const load: PageServerLoad = ({ params }) => {
	throw redirect(307, `/c/${params.slug}/events`);
};
