import { browser } from '$app/environment';
import { session } from '$lib/services/session.svelte';
import type { LayoutLoad } from './$types';

/**
 * Point the session's poll-scoped half at this Campaign.
 *
 * `pid`, the vote counters and the CTA flags are stored per Conversation
 * (`session-storage.ts`), and something has to say which one is current. Here
 * rather than in a layout component because `load` runs before any component
 * below it, and `contribute` reads those fields at init; and because a layout
 * component instance is reused across `[campaign]` values, where `load` re-runs.
 *
 * `return data` keeps the parent data every child `load` sees: a universal
 * `load` answering nothing narrows it, and two children read `campaign` off it.
 */
export const load: LayoutLoad = ({ data, depends }) => {
	depends('civicos:conversation');

	if (browser) session.useCampaign(data.campaign.id);
	return data;
};
