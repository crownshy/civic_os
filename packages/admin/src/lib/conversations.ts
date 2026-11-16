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
import { REGIONS, type RegionConfig } from '@civicos/shared/data/regions';
import { pollStatusFor, type PollStatus } from '@civicos/shared/data/poll-status';
import { participantUrl } from '@civicos/shared/data/place';
import { readAreas } from '@civicos/shared/data/areas';
import { env } from '$env/dynamic/public';

/**
 * Slugs a static route in admin's `/c/**` already uses. A Campaign carrying one
 * would be shadowed by that route, so both the create form and the Setup rename
 * reject them. civicos needs none since Campaigns moved under `/c/` (ADR 0019).
 */
export const RESERVED_ROUTE_SLUGS = ['new'] as const;

/**
 * What to show when comhairle refuses a slug as already taken (409 from
 * CreateConversation or from a Setup rename).
 *
 * Titles are not unique, so a second Campaign named the same thing does not
 * collide on its name: the create form derives the slug from the title, and the
 * slug is what comhairle uniques, across every Conversation including the ones
 * this Host cannot see. A raw "the server responded 409" sends people looking
 * for a permission problem instead of typing a different slug.
 */
export function slugTakenMessage(slug: string): string {
	return `Another conversation already uses "${slug}". Pick a different one.`;
}

/** Anything with an id and an optional backend slug can be routed. */
type RoutableConversation = Pick<LocalizedConversationDto, 'id'> & { slug?: string | null };

export type ConversationStatus = PollStatus;

/** What the sidebar and dashboard render one card/row from. */
export type ConversationSummary = {
	id: string;
	slug: string;
	title: string;
	status: ConversationStatus;
	/** The owning Host, used to label the Campaign. Null when unowned. */
	organizationId: string | null;
	/** The areas it runs in, by name, for a one-line label. Empty when none are picked. */
	areaNames: string[];
	/**
	 * Where participants go. Derived from the Conversation slug rather than
	 * stored, so every Campaign has one and not just the four in `regions.ts`.
	 * Null only when the Conversation has no slug to address it by, or when the
	 * participant host itself is unconfigured. See `PUBLIC_PARTICIPANT_BASE_URL`.
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
	conversation: Pick<LocalizedConversationDto, 'isLive' | 'isComplete' | 'metadata'>
): ConversationStatus {
	return pollStatusFor(conversation);
}

export function toSummary(conversation: LocalizedConversationDto): ConversationSummary {
	const region = regionFor(conversation);

	// Derived, not stored: `regions.ts` only ever had a `shareUrl` for its four
	// entries, so every Campaign created in admin had no participant link at all.
	// The Conversation slug is the whole address, so every Campaign has one from
	// creation. A legacy region's hardcoded `shareUrl`
	// no longer wins: it names a Place subdomain, and nothing reads the Place from
	// the hostname any more (ADR 0011).
	const shareUrl = participantUrl(conversation.slug || region?.slug || '', participantBase());

	return {
		id: conversation.id,
		slug: routeSlugFor(conversation),
		title: conversation.title,
		status: statusFor(conversation),
		organizationId: conversation.organizationId ?? null,
		areaNames: readAreas(conversation.metadata).map((area) => area.name),
		shareUrl: shareUrl || null
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
