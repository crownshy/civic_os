import { createApiClient } from '@crownshy/api-client/client';
import { findAttendance } from '$lib/services/event-attendance';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, cookies, url, depends }) => {
	// Registering happens in the browser, so this answer goes stale the moment
	// someone signs up. The key is what the modal invalidates.
	depends('civicos:attendance');

	const { campaign, participant } = await parent();

	// With the token, because attendance is scoped to the participant the cookie
	// names and the list is not readable anonymously.
	//
	// PROVISIONAL: whether an ordinary participant may read an event's attendance
	// list at all is unconfirmed. The local comhairle has no anonymous signup
	// route to test it with. A 403 costs nothing here: `findAttendance` answers
	// unresolved and the page keeps its cached flag, which is what it did before
	// this load existed. Confirm against a real participant session (#420).
	const authToken = cookies.get('auth-token');
	const api = createApiClient(`${url.origin}/api`, authToken, 'server');

	const { registered, resolved } = await findAttendance(api, {
		conversationId: campaign.id,
		eventId: params.slug,
		userId: participant?.userId ?? '',
		email: participant?.email
	});

	return { isRegistered: registered, registrationResolved: resolved };
};
