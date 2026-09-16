import type { createApiClient } from '@crownshy/api-client/client';
import type { CampaignPoll } from '@civicos/shared/data/place';

type Api = ReturnType<typeof createApiClient>;

interface SetCampaignLive {
	api: Api;
	conversationId: string;
	next: boolean;
	/** `campaign.pollLaunched`: null when the Polis step did not resolve. */
	pollLaunched: boolean | null;
	/** Re-runs the Campaign load. Awaited, so the getter below reads fresh data. */
	reload: () => Promise<void>;
	/** Read after `reload`, because launching repoints the step at a new poll. */
	pollIdentity: () => CampaignPoll | null;
}

/**
 * Turn a Campaign on or off, following comhairle's draft/launch model.
 *
 * A draft runs on the step's preview poll, so a Host can test it end to end.
 * The first time it goes live it is launched: comhairle clones the preview into
 * a new live poll (draft statements carry over as seeds, draft votes do not)
 * and syncs the moderation table from it. After that, turning it off and on
 * only flips `is_live`, since launching again would open yet another poll.
 *
 * Only the header toggle and the Open Poll Status card write this, so the two
 * cannot disagree about what going live does.
 */
export async function setCampaignLive({
	api,
	conversationId,
	next,
	pollLaunched,
	reload,
	pollIdentity
}: SetCampaignLive): Promise<void> {
	const params = { params: { conversation_id: conversationId } };

	if (!next) {
		await api.UpdateConversation({ is_live: false }, params);
		await reload();
		return;
	}

	if (pollLaunched === null) {
		throw new Error('Could not read this Campaign’s poll. Reload the page and try again.');
	}

	if (pollLaunched) {
		await api.UpdateConversation({ is_live: true }, params);
	} else {
		await api.LaunchConversation(undefined, params);
	}
	await reload();

	// civicos reads `metadata.poll` because the Polis step is 401 anonymously.
	// Until this runs after a launch, participants keep landing on the draft poll.
	const poll = pollIdentity();
	if (!poll) return;

	try {
		await api.PatchConversationMetadata({ poll }, params);
		await reload();
	} catch (e) {
		// Not worth failing the toggle: the Campaign is live either way, and going
		// live again re-runs this, so it heals rather than needing a repair.
		console.error('Mirroring the poll identity into metadata failed', e);
	}
}
