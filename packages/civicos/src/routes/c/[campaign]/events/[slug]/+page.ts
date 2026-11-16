import { CAMPAIGN_PAGES, campaignPath } from '@civicos/shared/data/place';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { session } from '$lib/services/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, data }) => {
	const { campaign, api } = await parent();
	const { slug } = params;

	try {
		const event = await api.GetEvent({
			params: { conversation_id: campaign.id, event_id: slug }
		});

		// Whether this participant is on the event's attendance list. The server
		// load is the answer (#420). The cached flag stands in only when it could
		// not resolve one, so a participant whose registration the backend cannot
		// confirm is not shown the signup form again.
		const isRegistered = data.registrationResolved
			? data.isRegistered
			: browser && session.isRegisteredForEvent(event.id);

		return { ...data, event, isRegistered };
	} catch (e) {
		console.error(e);

		redirect(302, campaignPath(params.campaign, CAMPAIGN_PAGES.events));
	}
};
