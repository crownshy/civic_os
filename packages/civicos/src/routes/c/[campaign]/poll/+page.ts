import { campaignPath } from '@civicos/shared/data/place';
import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * Voting needs a zip code. It no longer picks the Polis conversation, which the
 * Campaign names (#422), but it is still the only geography a participant ever
 * gives us, and joining is what files their participation. So a shared
 * poll link cannot be an entrance. Anyone without a session is sent to the Campaign's landing
 * page, which is where the zip is asked for.
 *
 * The participant comes from the root layout's server `load`, so on a cold load
 * this redirects before anything renders rather than re-deciding at hydration.
 * A backend that could not answer is not a "no": that would lock every
 * participant out of voting during an outage, so they are let through and the
 * page falls back to the cached session.
 */
export const load: PageLoad = async ({ params, parent, depends, data }) => {
	// The key admin's edits already invalidate the Campaign's own data under.
	depends('civicos:conversation');

	const { participant, participantResolved, campaign, pollStatus, preview } = await parent();

	// Paused or Done: the landing page says which, and links the results. Polis
	// refuses the votes as well, but only after someone has started voting. A
	// preview is a draft, which votes on the preview poll.
	if (pollStatus !== 'live' && !preview) {
		redirect(307, campaignPath(params.campaign));
	}

	// TEMPORARY: joining is the gate, not the stored zip. The zip cannot persist
	// while comhairle has no participant-writable Postcode, so reading it back
	// would bounce participants into a loop with the landing page. Restore
	// `!participant?.zipCode` once it can be saved and read from the account.
	// A preview never joins, so it has no participant to check.
	if (participantResolved && !participant && !preview) {
		redirect(307, campaignPath(params.campaign));
	}

	// A Campaign whose poll nothing names cannot be voted in. That used to fall
	// through to the zip code and then to an env var and quietly open somebody
	// else's poll; now it stops here, because the alternative is a voting screen
	// that loads forever against `conversation_id=`.
	//
	// The cause is always on the admin side: the Polis step is 401 anonymously,
	// so `metadata.poll` is the only copy, and creation writes it but only logs
	// a failure. Admin's header says so on the Campaign and offers the repair.
	if (!campaign.poll) {
		console.warn(`[Poll] "${params.campaign}" has no poll to serve`);
		error(503, {
			message: 'This conversation is not open for voting yet. Please try again shortly.'
		});
	}

	return data;
};
