/**
 * Bridge between comhairle's Conversation records and the `/c/<slug>` routes.
 *
 * The admin list of Campaigns now comes from the backend (#397), but the router
 * still keys on a slug, and `regions.ts` holds config the Conversation DTO does
 * not carry: zip prefixes for the county rollup, and the public share URL. This
 * module owns both halves of the bridge (#401) so the rules live in one place:
 *
 *  - which slug a Conversation routes under, and
 *  - which legacy region, if any, supplies its extra config.
 *
 * A legacy region's slug wins over the backend `slug` so URLs already in the
 * wild (`/c/utah`, `/c/oregon`) keep resolving. Conversations with no region
 * entry route under their backend slug, and fall back to their id when the
 * backend has none (`slug` is nullable in the schema).
 */

import type { LocalizedConversationDto } from '@crownshy/api-client/api';
import { REGIONS, type RegionConfig } from '$lib/config/regions';
import { participantUrl, readOrg, readPlace, type Place } from '@civicos/shared/data/place';
import { env } from '$env/dynamic/public';

/**
 * Slugs the `/c/**` routes already use for something else. A Campaign carrying
 * one would be shadowed by the static route and unreachable, so both the create
 * form and the Setup rename reject them.
 */
export const RESERVED_ROUTE_SLUGS = ['new'] as const;

/** Anything with an id and an optional backend slug can be routed. */
type RoutableConversation = Pick<LocalizedConversationDto, 'id'> & { slug?: string | null };

export type ConversationStatus = 'live' | 'draft' | 'complete';

/** What the sidebar and dashboard render one card/row from. */
export type ConversationSummary = {
	id: string;
	slug: string;
	title: string;
	status: ConversationStatus;
	/** The owning Host, used to label the Campaign. Null when unowned. */
	organizationId: string | null;
	/** Where this Campaign runs. Null until a Host publishes it to a Place. */
	place: Place | null;
	/** Region name from the legacy config; null for backend-only conversations. */
	placeName: string | null;
	/**
	 * Where participants go. Derived from the Place and the Campaign slug rather
	 * than stored, so every Campaign has one and not just the four in
	 * `regions.ts`. A Place is not required: without one the Campaign is served
	 * from the apex. Null only when the Conversation has no slug to address it by,
	 * or when the apex itself is unconfigured. See `PUBLIC_PARTICIPANT_BASE_URL`.
	 */
	shareUrl: string | null;
};

const regionsByConversationId = new Map(
	Object.values(REGIONS).map((region) => [region.conversationId, region])
);

/** The legacy `regions.ts` entry backing this conversation, if there is one. */
export function regionFor(conversation: RoutableConversation): RegionConfig | null {
	return regionsByConversationId.get(conversation.id) ?? null;
}

/** The `/c/<slug>` segment this conversation is reachable at. */
export function routeSlugFor(conversation: RoutableConversation): string {
	return regionFor(conversation)?.slug ?? conversation.slug ?? conversation.id;
}

/**
 * Find the conversation a `/c/<slug>` URL points at. The backend slug and the
 * raw id are accepted as aliases so a Campaign stays reachable whichever
 * identifier a link was built from.
 */
export function findByRouteSlug<T extends RoutableConversation>(
	conversations: T[],
	slug: string
): T | null {
	return (
		conversations.find(
			(conversation) =>
				routeSlugFor(conversation) === slug ||
				conversation.slug === slug ||
				conversation.id === slug
		) ?? null
	);
}

export function statusFor(
	conversation: Pick<LocalizedConversationDto, 'isLive' | 'isComplete'>
): ConversationStatus {
	if (conversation.isComplete) return 'complete';
	if (conversation.isLive) return 'live';
	return 'draft';
}

export function toSummary(conversation: LocalizedConversationDto): ConversationSummary {
	const region = regionFor(conversation);

	// The stored Place first, the legacy region behind it, same order civicos
	// resolves in. `GetPermittedConversations` returns `metadata`, so this works
	// on the list and not only on a single Campaign.
	const place =
		readPlace(conversation.metadata) ??
		(region ? { slug: region.slug, name: region.stateName } : null);

	// Derived, not stored: `regions.ts` only ever had a `shareUrl` for its four
	// entries, so every Campaign created in admin had no participant link at all.
	// Every Campaign has a participant site from creation: without a Place it is
	// served from the apex, and publishing to a Place moves it to that subdomain.
	const org = readOrg(conversation.metadata);
	const derived = participantUrl(
		place?.slug ?? '',
		conversation.slug ?? '',
		org?.slug ?? region?.hostName ?? '',
		participantBase()
	);

	// A legacy region's configured URL still wins, because Utah's and Oregon's
	// hostnames are live and predate this rule. Only while the region's slug is
	// still the Place it is served from, though: the env-driven `dev` entry
	// guesses `dev.localhost` while the seed writes whatever Place it was handed,
	// and civicos 404s a Campaign asked for under the wrong subdomain (ADR 0007)
	// rather than serving it anyway. A link that cannot resolve is worse than the
	// derived one it was overriding.
	const pinned = region && region.slug === place?.slug ? region.shareUrl : null;

	return {
		id: conversation.id,
		slug: routeSlugFor(conversation),
		title: conversation.title,
		status: statusFor(conversation),
		organizationId: conversation.organizationId ?? null,
		place,
		placeName: place?.name ?? null,
		shareUrl: (pinned ?? derived) || null
	};
}

/**
 * The participant apex, e.g. `bloomproject.us`. Configured rather than derived
 * from admin's own hostname: admin and the participant app are different
 * deployments and there is no reliable rule turning one into the other.
 *
 * Exported so a missing share link can say *why* it is missing: an unset apex
 * costs every Campaign its link at once, and that reads as a per-Campaign
 * problem unless the surface can tell the two apart.
 */
export function participantBase(): string {
	return env.PUBLIC_PARTICIPANT_BASE_URL ?? '';
}
