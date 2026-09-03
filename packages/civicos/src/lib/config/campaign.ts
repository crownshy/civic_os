/**
 * Which Conversation this deployment serves.
 *
 * `regions.ts` used to answer that on its own: the subdomain picked a
 * `RegionConfig`, and that config carried a hardcoded `conversationId`. A
 * Campaign is now the stored Conversation, and the region entry is demoted to
 * the default layer behind it, the same way Host copy already resolves
 * (see `host-copy.ts` and ADR 0003).
 *
 * The URL is `<place>.bloomproject.us/<campaign-slug>`: the subdomain is the
 * Place, the first path segment is the Campaign.
 */

import type { RegionConfig } from './regions';
import {
	isLegacyRegionConversation,
	placeForConversation,
	placeFromRegion,
	toPlaceSlug,
	type Place
} from './place';
import {
	conversationSlugFor,
	readOrg,
	readPoll,
	type CampaignOrg,
	type CampaignPoll
} from '@civicos/shared/data/place';
import { firstNonEmpty } from '$lib/utils/text';

/** The fields of a Conversation a Campaign identity is built from. */
export interface CampaignConversation {
	id: string;
	slug?: string | null;
	title: string;
	metadata?: unknown;
}

export interface Campaign {
	/** Backend Conversation id. Every downstream call keys on this. */
	id: string;
	/** Backend slug. Becomes the `/<campaign-slug>` path segment under #349. */
	slug: string;
	title: string;
	/**
	 * Where this Campaign runs. Null when it does not say and no legacy region
	 * claims it, which the route treats as unserveable (ADR 0007).
	 */
	place: Place | null;
	/**
	 * Which Polis conversation this Campaign's poll is, when the Conversation
	 * says. Null falls back to `regions.ts`, which is the only other place the
	 * poll id exists: the Polis workflow step is 401 anonymously.
	 */
	poll: CampaignPoll | null;
	/**
	 * The Host, for the `<org>` segment of the URL. Null falls back to a
	 * placeholder: the segment is decorative, so an unknown Host costs a less
	 * pretty address, not a broken one.
	 */
	org: CampaignOrg | null;
	/**
	 * Whether a stored Conversation backed this, or only `regions.ts` did.
	 * `region` means the backend was unreachable or had no such Campaign.
	 */
	source: 'conversation' | 'region';
	/**
	 * Whether a `regions.ts` entry is this Campaign rather than just the defaults
	 * behind it. Utah, Oregon and the catch-all are; everything created in admin
	 * is not. It is what decides whether a zip may route a participant to another
	 * subdomain, because only for these is a region the same thing as a Campaign.
	 */
	isLegacyRegion: boolean;
}

/**
 * Retired. A Campaign no longer needs a Place to be served: the path identifies
 * it and an unpublished one is served from the apex, so `place` is optional at
 * every render site.
 *
 * @deprecated Use `Campaign` and handle `place === null`.
 */
export type ServedCampaign = Campaign;

/**
 * Identifiers to try against `GET /conversation/:id` for a `/<slug>` URL, best
 * first. That endpoint accepts a slug or a UUID, so both forms go through one
 * call shape.
 *
 * The legacy id leads when the slug names a `regions.ts` entry, so `/utah` and
 * `/oregon` keep resolving to the Campaign they always did even if some other
 * Conversation later takes those slugs. It is offered only on a match:
 * `getRegionBySubdomain` answers `GENERIC_REGION` for any subdomain it does not
 * know, and that hardcoded id must never stand in for a slug nobody asked for.
 */
export function campaignCandidates(
	slug: string,
	region: RegionConfig,
	placeSlug?: string
): string[] {
	const legacyId = region.slug === slug ? region.conversationId : null;

	// A Campaign runs in many Places and each pair is its own Conversation, so
	// the Conversation for `/ai` under `utah.` is `ai-utah`. That is tried first:
	// a bare `ai` would either miss or, worse, hit some other Place's poll.
	// Campaigns that predate the convention still resolve on the bare slug
	// behind it.
	const scoped = placeSlug ? conversationSlugFor(slug, placeSlug) : null;

	return [...new Set([legacyId, scoped, slug].filter((c): c is string => !!c && c.trim() !== ''))];
}

/** Merge the stored Conversation over the region defaults. */
export function resolveCampaign(
	conversation: CampaignConversation | null | undefined,
	region: RegionConfig
): Campaign {
	if (!conversation) {
		return {
			id: region.conversationId,
			slug: region.slug,
			title: region.heroHeader,
			// Reached only when the slug names this region, so it is the Place.
			place: placeFromRegion(region),
			poll: null,
			org: region.hostName ? { slug: toPlaceSlug(region.hostName), name: region.hostName } : null,
			source: 'region',
			// Reached only by falling back to the region, so the region is it.
			isLegacyRegion: true
		};
	}

	return {
		id: conversation.id,
		slug: firstNonEmpty(conversation.slug, region.slug),
		title: firstNonEmpty(conversation.title, region.heroHeader),
		place: placeForConversation(conversation.id, conversation.metadata),
		poll: readPoll(conversation.metadata),
		org:
			readOrg(conversation.metadata) ??
			(region.hostName ? { slug: toPlaceSlug(region.hostName), name: region.hostName } : null),
		source: 'conversation',
		isLegacyRegion: isLegacyRegionConversation(conversation.id)
	};
}

/**
 * The geography to label participant chrome with.
 *
 * The Campaign's Place, which `placeForConversation` has already resolved
 * through the legacy region for Utah and Oregon. The region behind it covers
 * the Campaign that has not been published to a Place yet and the one whose
 * backend was unreachable.
 *
 * This used to be derived from the participant's zip code, which answered a
 * different question: which Campaign a zip prefix belongs to, from back when a
 * zip was the only routing information there was. The URL names the Campaign
 * now, and the Campaign names its Place.
 *
 * The last fallback is still `GENERIC_REGION.stateName` for a subdomain nobody
 * recognises, because `getRegionBySubdomain` is total. #425 is what makes that
 * unrepresentable.
 */
export function placeNameFor(
	campaign: Pick<Campaign, 'place'> | null | undefined,
	region: RegionConfig
): string {
	return campaign?.place?.name ?? region.stateName;
}
