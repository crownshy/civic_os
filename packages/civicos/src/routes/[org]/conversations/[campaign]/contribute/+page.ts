import { campaignPath } from '@civicos/shared/data/place';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * Voting needs a zip code: it picks the Polis conversation, and it is the only
 * geography a participant ever gives us. So a shared `/contribute` link cannot
 * be an entrance. Anyone without a session is sent to the Campaign's landing
 * page, which is where the zip is asked for.
 *
 * The participant comes from the root layout's server `load`, so on a cold load
 * this redirects before anything renders rather than re-deciding at hydration.
 * A backend that could not answer is not a "no": that would lock every
 * participant out of voting during an outage, so they are let through and the
 * page falls back to the cached session.
 */
export const load: PageLoad = async ({ params, parent }) => {
	const { participant, participantResolved } = await parent();

	if (participantResolved && !participant?.zipCode) {
		redirect(307, campaignPath(params.campaign, params.org));
	}
};
