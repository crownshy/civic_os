import { createApiClient } from '@crownshy/api-client/client';
import { toSummary, type ConversationSummary } from '$lib/conversations';
import type { LayoutServerLoad } from './$types';

/** Every Campaign the caller may see, unfiltered. */
const PERMITTED_QUERIES = { limit: 200 };

const STATUS_ORDER: Record<ConversationSummary['status'], number> = {
	live: 0,
	draft: 1,
	complete: 2
};

/** Live Campaigns first, then alphabetical, so the sidebar order is stable. */
function bySidebarOrder(a: ConversationSummary, b: ConversationSummary) {
	const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
	return byStatus !== 0 ? byStatus : a.title.localeCompare(b.title);
}

/**
 * Expose the auth-token to the universal +layout.ts so the server-side api
 * client can authenticate during SSR (e.g. on a full-page refresh), resolve
 * whether the caller is a Site SuperAdmin (BLOOM / Crown Shy staff), and load
 * the Campaigns this user is allowed to see.
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
 *
 * `conversations` is loaded here rather than per-page because the sidebar, the
 * dashboard, and the /c/[slug] access check all read the same list (#397).
 * GetPermittedConversations is the backend's own answer to "what may this user
 * see", so a Host member gets their org's Campaigns and a super-admin gets all.
 */
export const load: LayoutServerLoad = async ({ cookies, url, depends }) => {
	depends('app:conversations');

	const authToken = cookies.get('auth-token');
	if (!authToken) return { authToken, canCreateHost: false, conversations: [] };

	const api = createApiClient(`${url.origin}/api`, authToken, 'server');

	const [canCreateHost, conversations] = await Promise.all([
		api
			.GetUserOrganizations()
			.then((res) => res.canCreateOrganization)
			.catch((e) => {
				console.warn('GetUserOrganizations failed', e);
				return false;
			}),
		api
			.GetPermittedConversations({ queries: PERMITTED_QUERIES })
			.then((res) => res.records.map(toSummary).sort(bySidebarOrder))
			.catch((e) => {
				console.warn('GetPermittedConversations failed', e);
				return [] as ConversationSummary[];
			})
	]);

	return { authToken, canCreateHost, conversations };
};
