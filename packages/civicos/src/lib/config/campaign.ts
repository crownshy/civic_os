/**
 * Which Conversation this deployment serves.
 *
 * `regions.ts` used to answer that on its own: the subdomain picked a
 * `RegionConfig`, and that config carried a hardcoded `conversationId`. A
 * Campaign is now the stored Conversation, and the region entry is demoted to
 * the default layer behind it, the same way Host copy already resolves
 * (see `host-copy.ts` and ADR 0003).
 *
 * The URL is `/<org>/conversations/<conversation-slug>`: the last segment names
 * the Conversation, and nothing about the hostname is read (ADR 0011).
 */

import { GENERIC_REGION, REGIONS, type RegionConfig } from './regions';
import {
	isLegacyRegionConversation,
	legacyRegionForConversation,
	placeForConversation,
	placeFromRegion,
	toPlaceSlug,
	type Place
} from './place';
import {
	readCoHosts,
	readOrg,
	readPoll,
	type CampaignCoHost,
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
	/** Backend slug. The `<conversation-slug>` segment of the URL. */
	slug: string;
	title: string;
	/**
	 * Where this Campaign runs. Null when it does not say and no legacy region
	 * claims it, which leaves it off every Place page (ADR 0011).
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
	 * The organizations to credit on the landing page, from
	 * `metadata.cohosts` where admin mirrored them.
	 *
	 * Empty rather than the catch-all's `partners` for a Campaign with none:
	 * `regions.ts` only stands in where the region IS the Campaign, otherwise
	 * every Campaign created in admin credits The Bloom Project.
	 */
	cohosts: CampaignCoHost[];
	/**
	 * Whether a stored Conversation backed this, or only `regions.ts` did.
	 * `region` means the backend was unreachable or had no such Campaign.
	 */
	source: 'conversation' | 'region';
	/**
	 * Whether a `regions.ts` entry is this Campaign rather than just the defaults
	 * behind it. Utah, Oregon and the catch-all are; everything created in admin
	 * is not. It is what decides whether a zip may route a participant to another
	 * Campaign, because only for these is a region the same thing as a Campaign.
	 */
	isLegacyRegion: boolean;
}

/**
 * Retired. A Campaign no longer needs a Place to be served: the path identifies
 * it, so `place` is optional at every render site.
 *
 * @deprecated Use `Campaign` and handle `place === null`.
 */
export type ServedCampaign = Campaign;

/**
 * The `regions.ts` entry a URL slug names, the catch-all included, or null.
 * Own keys only, so a slug such as `constructor` cannot reach
 * `Object.prototype`.
 */
export function legacyRegionForSlug(slug: string): RegionConfig | null {
	const key = slug.trim();
	if (key === GENERIC_REGION.slug) return GENERIC_REGION;

	return Object.hasOwn(REGIONS, key) ? REGIONS[key] : null;
}

/**
 * Identifiers to try against `GET /conversation/:id` for a URL slug, best
 * first. That endpoint accepts a slug or a UUID, so both forms go through one
 * call shape.
 *
 * The legacy id leads when the slug names a `regions.ts` entry, so `utah` and
 * `oregon` keep resolving to the Campaign they always did even if some other
 * Conversation later takes those slugs. Any other slug is tried as it is: the
 * Place is already part of it (`ai-utah`), so there is nothing to add.
 */
export function campaignCandidates(slug: string): string[] {
	const legacyId = legacyRegionForSlug(slug)?.conversationId ?? null;

	return [...new Set([legacyId, slug].filter((c): c is string => !!c && c.trim() !== ''))];
}

/**
 * The `regions.ts` defaults behind a Campaign: the entry that owns its
 * Conversation, else the one its slug names, else the catch-all.
 *
 * This used to be whichever region the request's subdomain named, which dressed
 * a Campaign in another region's copy whenever it was opened under that host.
 * The Campaign picks its own now (ADR 0011).
 */
export function regionForCampaign(
	conversationId: string | null | undefined,
	slug: string
): RegionConfig {
	return (
		(conversationId ? legacyRegionForConversation(conversationId) : null) ??
		legacyRegionForSlug(slug) ??
		GENERIC_REGION
	);
}

/**
 * A legacy region's `partners` array in the co-host shape. Utah and Oregon
 * predate co-host grants, so their credits are still checked in.
 */
function partnersAsCoHosts(region: RegionConfig): CampaignCoHost[] {
	return region.partners.map((partner) => ({
		name: partner.name,
		url: partner.url,
		...(partner.logo ? { logo: partner.logo } : {})
	}));
}

/** The first list with anything in it. All-or-nothing, like `resolveFaq`. */
function firstNonEmptyList<T>(...lists: T[][]): T[] {
	return lists.find((list) => list.length > 0) ?? [];
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
			// Reached only when the region IS the Campaign, so its partners are its
			// co-hosts.
			cohosts: partnersAsCoHosts(region),
			source: 'region',
			// Reached only by falling back to the region, so the region is it.
			isLegacyRegion: true
		};
	}

	const isLegacyRegion = isLegacyRegionConversation(conversation.id);

	return {
		id: conversation.id,
		slug: firstNonEmpty(conversation.slug, region.slug),
		title: firstNonEmpty(conversation.title, region.heroHeader),
		place: placeForConversation(conversation.id, conversation.metadata),
		poll: readPoll(conversation.metadata),
		org:
			readOrg(conversation.metadata) ??
			(region.hostName ? { slug: toPlaceSlug(region.hostName), name: region.hostName } : null),
		cohosts: firstNonEmptyList(
			readCoHosts(conversation.metadata),
			isLegacyRegion ? partnersAsCoHosts(region) : []
		),
		source: 'conversation',
		isLegacyRegion
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
 * The last fallback is still `GENERIC_REGION.stateName` for a Campaign no
 * region claims, because `regionForCampaign` is total. #425 is what makes that
 * unrepresentable.
 */
export function placeNameFor(
	campaign: Pick<Campaign, 'place'> | null | undefined,
	region: RegionConfig
): string {
	return campaign?.place?.name ?? region.stateName;
}
