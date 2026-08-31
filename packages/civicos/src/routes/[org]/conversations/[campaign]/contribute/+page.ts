import { campaignPath } from '@civicos/shared/data/place';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { session } from '$lib/services/session.svelte';
import type { PageLoad } from './$types';

/**
 * Voting needs a zip code: it picks the Polis conversation, and it is the only
 * geography a participant ever gives us. So a shared `/contribute` link cannot
 * be an entrance. Anyone without a session is sent to the Campaign's landing
 * page, which is where the zip is asked for.
 *
 * The session is localStorage, so this can only be decided in the browser. On a
 * cold load the server renders the page's loading shell and the check runs
 * again at hydration; a returning participant keeps their bookmark.
 */
export const load: PageLoad = ({ params }) => {
	if (browser && !session.hasSession) {
		redirect(307, campaignPath(params.campaign, params.org));
	}
};
