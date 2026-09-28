import { campaignPath } from '@civicos/shared/data/place';
import { error, redirect } from '@sveltejs/kit';
import { pollFor, type Campaign } from '$lib/config/campaign';
import {
	aboutYouQuestionsFor,
	aboutYouQuestionsFromBackend,
	type AboutYouQuestion,
	type Participation
} from '$lib/config/participation';
import type { DemographicQuestionData } from '@civicos/shared/data/demographics';
import type { createApiClient } from '@crownshy/api-client/client';
import type { PageLoad } from './$types';

/**
 * The About You questions the Host switched on for this Campaign in admin,
 * which are comhairle's ConversationDemographics links (#441). Public once the
 * Campaign is live, and only a live Campaign gets this far.
 *
 * Two cases fall back to the old metadata switches, which read as all on. A
 * read that fails, because asking too much during an outage beats silently
 * asking nothing. And a legacy region with no links: Utah and Oregon predate
 * them, so an empty answer there means never configured, not all switched off.
 */
async function aboutYouQuestionsForCampaign(
	api: ReturnType<typeof createApiClient>,
	campaign: Campaign,
	participation: Participation
): Promise<AboutYouQuestion[]> {
	const fallback = () => aboutYouQuestionsFor(participation.demographics);
	if (!campaign.id) return fallback();

	try {
		const { records } = await api.GetDemographicsQuestions({
			queries: { conversation_id: campaign.id, limit: 50 }
		});
		if (campaign.isLegacyRegion && records.length === 0) return fallback();
		return aboutYouQuestionsFromBackend(records as DemographicQuestionData[]);
	} catch (e) {
		console.warn(`[About You] Could not read "${campaign.id}"'s questions`, e);
		return fallback();
	}
}

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
export const load: PageLoad = async ({ params, parent, depends }) => {
	// The key admin's edits already invalidate the Campaign's own data under.
	depends('civicos:conversation');

	const { participant, participantResolved, campaign, region, api, participation } = await parent();

	// TEMPORARY: joining is the gate, not the stored zip. The zip cannot persist
	// while comhairle has no `zipcode` demographics question, so reading it back
	// bounced every participant off this page and into a loop with the landing
	// page. Restore `!participant?.zipCode` once that question exists.
	if (participantResolved && !participant) {
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

	return { aboutYouQuestions: await aboutYouQuestionsForCampaign(api, campaign, participation) };
};
