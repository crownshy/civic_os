import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Gate the /sysadmin surface on the create-host capability. `canCreateHost` is
 * resolved once in the root +layout.server.ts (from GetUserOrganizations); read
 * it through parent() rather than re-fetching. Users who can't create Hosts are
 * bounced to the dashboard. The comhairle backend also enforces creation on its
 * side (defense in depth). See docs/adr/0002.
 */
export const load: LayoutServerLoad = async ({ parent }) => {
	const { canCreateHost } = await parent();
	if (!canCreateHost) redirect(303, '/');
	return { canCreateHost };
};
