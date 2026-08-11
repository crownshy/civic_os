import { createApiClient } from '@crownshy/api-client/client';
import type { LayoutServerLoad } from './$types';

/**
 * Expose the auth-token to the universal +layout.ts so the server-side api
 * client can authenticate during SSR (e.g. on a full-page refresh), and resolve
 * whether the caller is a Site SuperAdmin (BLOOM / Crown Shy staff).
 *
 * NOTE: auth-token is httpOnly, so it can only be read here on the server.
 * Returning it means it is serialized into the client data payload — an
 * accepted tradeoff to let SSR render real data instead of empty-then-populate.
 *
 * `canCreateHost` gates the /sysadmin surfaces (create Hosts, and later Places /
 * users, #372). We read it from GetUserOrganizations.canCreateOrganization, the
 * backend's own capability flag (true only for Site super-admins), rather than
 * GetUserRoles — that handler is currently a stub that never reports SuperAdmin.
 * Distinct from the binary `isAdmin` gate in hooks.server.ts. See docs/adr/0002.
 */
export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const authToken = cookies.get('auth-token');
	if (!authToken) return { authToken, canCreateHost: false };

	const api = createApiClient(`${url.origin}/api`, authToken, 'server');
	let canCreateHost = false;
	try {
		const res = await api.GetUserOrganizations();
		canCreateHost = res.canCreateOrganization;
	} catch (e) {
		console.warn('GetUserOrganizations failed', e);
	}

	return { authToken, canCreateHost };
};
