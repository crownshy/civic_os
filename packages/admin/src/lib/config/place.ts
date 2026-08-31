/**
 * The Place a Campaign runs in, on the admin side.
 *
 * The contract (the `place` metadata key, `readPlace`, the slug rules) is
 * `@civicos/shared/data/place`, shared with civicos so the app that writes a
 * Place and the app that serves from it cannot disagree about the shape. See
 * ADR 0006 for why it is metadata and not the Region API.
 *
 * INTERIM STORAGE, like `demographics.ts` and `participant-asks.ts`: a Place is
 * not a record, so "add a Place" means writing the object onto a Conversation.
 * Two Campaigns in the same Place duplicate the name and nothing enumerates
 * Places.
 *
 * ONE PLACE PER CAMPAIGN (ADR 0008). Campaigns and Places are many-to-many in
 * principle, but comhairle cannot express it and the propagation and ownership
 * rules are unanswered, so this is a single Place and not a list. The evidence
 * and what it would take are in `prototypes/campaign-places/`.
 */

import type { RegionConfig } from '$lib/config/regions';
import {
	campaignSlugFrom,
	conversationSlugFor,
	readPlace,
	type Place
} from '@civicos/shared/data/place';

export {
	readPlace,
	toPlaceSlug,
	placeFromName,
	PLACE_METADATA_KEY
} from '@civicos/shared/data/place';
export type { Place } from '@civicos/shared/data/place';

/**
 * The Place shown on Setup: what the Conversation stores, else the legacy
 * `regions.ts` entry that owns it.
 *
 * The fallback is what admin rendered before a Place could be written at all,
 * so Utah and Oregon keep their chip without anyone re-entering it. Once a Host
 * saves a Place the stored value wins, which is also the order civicos resolves
 * in, so the two surfaces agree.
 */
export function placeForCampaign(metadata: unknown, region: RegionConfig | null): Place | null {
	const stored = readPlace(metadata);
	if (stored) return stored;

	return region ? { slug: region.slug, name: region.stateName } : null;
}

/**
 * The Conversation slug after a Place change.
 *
 * A Campaign runs in many Places and each pair is its own Conversation, so the
 * Conversations are slugged `<campaign>-<place>`; that suffix is what lets
 * `<place>.bloomproject.us/<campaign>` narrow to one of them (ADR 0007). The
 * Host never types it, they name a Place and this follows.
 *
 * The previous Place's suffix comes off before the new one goes on, so moving
 * Utah to Oregon gives `ai-oregon` and not `ai-utah-oregon`. Clearing the Place
 * strips back to the bare Campaign slug.
 *
 * The new Place is stripped too, which makes this idempotent: a slug that
 * already ends in the Place it is being scoped to comes back unchanged instead
 * of doubling up (`ai-in-dundee` in Dundee stays put, it does not become
 * `ai-in-dundee-dundee`).
 */
export function rescopedSlug(
	currentSlug: string,
	previousPlaceSlug: string,
	nextPlaceSlug: string
): string {
	const bare = campaignSlugFrom(currentSlug, [previousPlaceSlug, nextPlaceSlug].filter(Boolean));

	return conversationSlugFor(bare, nextPlaceSlug);
}
