import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Anyone who belongs to a Host may open the Host pages; each page narrows it from
 * there. `hostAccess` comes from the root layout. See docs/adr/0015.
 */
export const load: LayoutServerLoad = async ({ parent }) => {
	const { hostAccess } = await parent();
	if (!hostAccess.all && hostAccess.hosts.length === 0) redirect(303, '/');
};
