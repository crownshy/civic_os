import type { LayoutServerLoad } from './$types';

/**
 * Expose the auth-token to the universal +layout.ts so the server-side api
 * client can authenticate during SSR (e.g. on a full-page refresh).
 *
 * NOTE: auth-token is httpOnly, so it can only be read here on the server.
 * Returning it means it is serialized into the client data payload — an
 * accepted tradeoff to let SSR render real data instead of empty-then-populate.
 */
export const load: LayoutServerLoad = async ({ cookies }) => {
	return { authToken: cookies.get('auth-token') };
};
