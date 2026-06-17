import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// /c/[slug] redirects to Overview tab.
export const load: PageServerLoad = ({ params }) => {
	throw redirect(307, `/c/${params.slug}/overview`);
};
