import type { Api } from '@civicos/shared/api';
import type { CampaignPoll } from '@civicos/shared/data/place';
import { POLL_PAUSED_METADATA_KEY, type PollStatus } from '@civicos/shared/data/poll-status';

/** Draft is not a target: once launched, a Campaign never goes back (#443). */
export type PollStatusTarget = Exclude<PollStatus, 'draft'>;

interface SetPollStatus {
	api: Api;
	conversationId: string;
	next: PollStatusTarget;
	/** `campaign.pollLaunched`: null when the Polis step did not resolve. */
	pollLaunched: boolean | null;
	/** Null when the Campaign has no Polis step, so there is no poll to close. */
	polisWorkflowStepId: string | null;
	/** Re-runs the Campaign load. Awaited, so the getter below reads fresh data. */
	reload: () => Promise<void>;
	/** Read after `reload`, because launching repoints the step at a new poll. */
	pollIdentity: () => CampaignPoll | null;
}

/**
 * Move an Open Poll between Live, Paused and Done, following comhairle's
 * draft/launch model.
 *
 * A draft runs on the step's preview poll, so a Host can test it end to end.
 * The first time it goes live it is launched: comhairle clones the preview into
 * a new live poll (draft statements carry over as seeds, draft votes do not)
 * and syncs the moderation table from it. After that `is_live` stays true:
 * setting it false is what made a turned-off Campaign 404 for participants.
 *
 * Paused and Done also close the Polis poll, because civicos votes through
 * Polis directly and nothing in comhairle refuses a vote on a closed Campaign.
 *
 * Only the header control and the Open Poll Status card write this, so the two
 * cannot disagree about what a status means.
 */
export async function setPollStatus({
	api,
	conversationId,
	next,
	pollLaunched,
	polisWorkflowStepId,
	reload,
	pollIdentity
}: SetPollStatus): Promise<void> {
	const params = { params: { conversation_id: conversationId } };

	if (pollLaunched === null) {
		throw new Error('Could not read this Campaign’s poll. Reload the page and try again.');
	}
	if (!pollLaunched && next !== 'live') {
		throw new Error('This poll has not gone live yet, so there is nothing to pause or finish.');
	}

	if (pollLaunched) {
		await api.UpdateConversation({ is_live: true, is_complete: next === 'complete' }, params);
	} else {
		await api.LaunchConversation(undefined, params);
	}
	await api.PatchConversationMetadata({ [POLL_PAUSED_METADATA_KEY]: next === 'paused' }, params);

	try {
		if (polisWorkflowStepId) {
			await api.PolisUpdateConfig({
				workflow_step_id: polisWorkflowStepId,
				is_active: next === 'live'
			});
		}
	} catch (e) {
		await reload();
		console.error('Setting the Polis poll active flag failed', e);
		throw new Error(
			next === 'live'
				? 'Saved, but the poll is still closed to votes. Try again.'
				: 'Saved, but the poll is still accepting votes. Try again.'
		);
	}
	await reload();

	if (next === 'live') await mirrorPollIdentity(api, params, pollIdentity, reload);
}

/**
 * civicos reads `metadata.poll` because the Polis step is 401 anonymously.
 * Until this runs after a launch, participants keep landing on the draft poll.
 */
async function mirrorPollIdentity(
	api: Api,
	params: { params: { conversation_id: string } },
	pollIdentity: () => CampaignPoll | null,
	reload: () => Promise<void>
) {
	const poll = pollIdentity();
	if (!poll) return;

	try {
		await api.PatchConversationMetadata({ poll }, params);
		await reload();
	} catch (e) {
		// Not worth failing the change: the Campaign is live either way, and going
		// live again re-runs this, so it heals rather than needing a repair.
		console.error('Mirroring the poll identity into metadata failed', e);
	}
}
