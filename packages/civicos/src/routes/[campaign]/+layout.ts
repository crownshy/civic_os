import { browser } from '$app/environment';
import { joinContextFor } from '$lib/services/join';
import { knownParticipant } from '$lib/services/participant';
import { session } from '$lib/services/session.svelte';
import type { LayoutLoad } from './$types';

/**
 * Point the session's poll-scoped half at this Campaign, and settle who the
 * participant is.
 *
 * `pid`, the vote counters and the CTA flags are stored per Conversation
 * (`session-storage.ts`), and something has to say which one is current. Here
 * rather than in a layout component because `load` runs before any component
 * below it, and the poll reads those fields at init; and because a layout
 * component instance is reused across `[campaign]` values, where `load` re-runs.
 *
 * Spreading `data` keeps the parent data every child `load` sees: a universal
 * `load` answering nothing narrows it, and two children read `campaign` off it.
 * A Place has no poll, so there is nothing to point at.
 */
export const load: LayoutLoad = async ({ data, parent, depends }) => {
	depends('civicos:conversation');

	// Only the browser has a cache. On the server an outage reads as nobody,
	// and the landing page holds its join form back until hydration for that.
	const { participant, participantResolved, api } = await parent();
	const known = knownParticipant(
		{ participant, resolved: participantResolved },
		browser ? { userId: session.userId, zipCode: session.zipCode } : { userId: null, zipCode: '' }
	);

	if (data.kind !== 'campaign') return { ...data, knownParticipant: known };

	if (browser) session.useCampaign(data.campaign.id, data.preview);
	return { ...data, knownParticipant: known, joinContext: joinContextFor({ ...data, api }) };
};
