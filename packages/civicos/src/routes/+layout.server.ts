import { createApiClient } from '@crownshy/api-client/client';
import { resolveParticipant } from '$lib/services/participant';
import { GENERIC_REGION } from '$lib/config/regions';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url, depends }) => {
	// Joining writes the participant from the browser, so this answer goes stale
	// the moment someone signs up. The key is what `invalidate` targets.
	depends('civicos:participant');

	const authToken = cookies.get('auth-token');

	// Through the same-origin proxy, as every server load here does. Unlike the
	// others this one passes the token on, because the cookie the proxy forwards
	// is the whole of what identifies the participant.
	const api = createApiClient(`${url.origin}/api`, authToken, 'server');

	const { participant, resolved } = await resolveParticipant(api, authToken);

	return {
		// The catch-all defaults, for the pages that are not a Campaign. A Campaign
		// replaces this with its own one level down, in `[campaign]/+layout.server.ts`,
		// because the slug that picks it lives there. Nothing reads the hostname
		// (ADR 0011).
		region: GENERIC_REGION,
		participant,
		participantResolved: resolved
	};
};
