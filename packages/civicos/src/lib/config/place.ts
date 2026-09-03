/**
 * Which Place this Campaign runs in, for the participant app.
 *
 * The metadata contract itself (the `place` key, `readPlace`, the slug rules)
 * lives in `@civicos/shared/data/place` so `admin`, which now writes it on
 * Setup, cannot drift from what this app reads. Re-exported here because
 * ADR 0006 names this file as the single read site: everything civicos-shaped
 * (the `regions.ts` fallback, the subdomain swap) stays below.
 */

import { REGIONS } from '@civicos/shared/data/regions';
import { readPlace, type Place } from '@civicos/shared/data/place';
import type { RegionConfig } from './regions';

export {
	readPlace,
	PLACE_METADATA_KEY,
	toPlaceSlug,
	placeFromName,
	conversationSlugFor,
	campaignSlugFrom,
	readPoll,
	POLL_METADATA_KEY
} from '@civicos/shared/data/place';
export type { Place, CampaignPoll } from '@civicos/shared/data/place';

/**
 * The Place a legacy `regions.ts` entry stands for. Utah and Oregon predate the
 * concept, so their Place is derived from the region rather than stored.
 */
export function placeFromRegion(region: RegionConfig): Place {
	return { slug: region.slug, name: region.stateName };
}

/**
 * The Place a Conversation belongs to, or null when it does not say.
 *
 * The fallback is keyed on the Conversation, never on the region the request
 * arrived under. Deriving it from the subdomain would make every Campaign look
 * like it belonged wherever it was asked for, which is the same as not checking
 * at all.
 *
 * The map here is the shared one, without the local dev region: the dev
 * Conversation carries a stored place from `scripts/seed-dev.sh`, so it never
 * reaches this fallback.
 */
const regionsByConversationId = new Map(
	Object.values(REGIONS).map((region) => [region.conversationId, region])
);

export function placeForConversation(conversationId: string, metadata: unknown): Place | null {
	const stored = readPlace(metadata);
	if (stored) return stored;

	const owning = regionsByConversationId.get(conversationId);
	return owning ? placeFromRegion(owning) : null;
}

/**
 * Whether a `regions.ts` entry IS this Conversation, rather than merely
 * supplying defaults behind it. True only for Utah, Oregon and the catch-all,
 * which predate stored Campaigns and are the only ones a zip can route between.
 */
export function isLegacyRegionConversation(conversationId: string): boolean {
	return regionsByConversationId.has(conversationId);
}
