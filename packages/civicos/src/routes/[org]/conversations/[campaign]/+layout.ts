import { browser } from '$app/environment';
import { session } from '$lib/services/session.svelte';
import type { LayoutLoad } from './$types';

/**
 * Point the session's poll-scoped half at this Campaign.
 *
 * `pid`, the vote counters and the CTA flags are stored per Conversation
 * (`session-storage.ts`) and something has to say which one is current. It
 * happens here rather than in a layout component for two reasons: `load` runs
 * before any component below it, and `contribute` reads those fields at init to
 * decide which screen to open on; and `load` re-runs when `[campaign]` changes,
 * where a layout component instance is reused and would go on writing the first
 * Campaign's record.
 *
 * Returning `data` is not decoration: a universal `load` that answers nothing
 * narrows the parent data every child `load` sees, and two of them read
 * `campaign` off it.
 */
export const load: LayoutLoad = ({ data }) => {
	if (browser) session.useCampaign(data.campaign.id);
	return data;
};
