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
	/** Region name from the legacy config; null for backend-only conversations. */
	placeName: string | null;
	/** Public participant URL from the legacy config; null when unconfigured. */
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
	return {
		id: conversation.id,
		slug: routeSlugFor(conversation),
		title: conversation.title,
		status: statusFor(conversation),
		organizationId: conversation.organizationId ?? null,
		placeName: region?.stateName ?? null,
		shareUrl: region?.shareUrl ?? null
	};
}
