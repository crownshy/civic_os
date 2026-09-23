import { campaignPath } from '@civicos/shared/data/place';
import { error, redirect } from '@sveltejs/kit';
import { pollFor } from '$lib/config/campaign';
import type { PageLoad } from './$types';

/**
 * Voting needs a zip code. It no longer picks the Polis conversation, which the
 * Campaign names (#422), but it is still the only geography a participant ever
 * gives us, and joining is what files their participation. So a shared
 * `/contribute` link cannot be an entrance. Anyone without a session is sent to the Campaign's landing
 * page, which is where the zip is asked for.
 *
 * The participant comes from the root layout's server `load`, so on a cold load
 * this redirects before anything renders rather than re-deciding at hydration.
 * A backend that could not answer is not a "no": that would lock every
 * participant out of voting during an outage, so they are let through and the
 * page falls back to the cached session.
 */
export const load: PageLoad = async ({ params, parent }) => {
	const { participant, participantResolved, campaign, region } = await parent();

	if (participantResolved && !participant?.zipCode) {
		redirect(307, campaignPath(params.campaign, params.org));
	}

	// A Campaign whose poll nothing names cannot be voted in. That used to fall
	// through to the zip code and then to an env var and quietly open somebody
	// else's poll; now it stops here, because the alternative is a voting screen
	// that loads forever against `conversation_id=`.
	//
	// The cause is always on the admin side: the Polis step is 401 anonymously,
	// so `metadata.poll` is the only copy, and creation writes it but only logs
	// a failure. Admin's header says so on the Campaign and offers the repair.
	if (!pollFor(campaign, region)) {
		console.warn(`[Poll] "${params.campaign}" has no poll to serve`);
		error(503, {
			message: 'This conversation is not open for voting yet. Please try again shortly.'
		});
	}
};
