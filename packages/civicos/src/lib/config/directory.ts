/**
 * The Campaigns anyone can walk into, for the directory at `/conversations`.
 *
 * A 404 used to offer nothing but a link off the product, because there is no
 * single right address to correct someone to (ADR 0007). A directory is the
 * other answer: it does not claim to know which Campaign was meant, it lists
 * the ones that are running and lets the participant pick.
 *
 * Built from `GET /conversation`, which is the only list endpoint the anonymous
 * app can reach and already returns only live Campaigns. It also returns
 * `metadata`, which is what makes each row addressable: the Place and the Host
 * are mirrored there, and between them they are the whole participant URL.
 */

import { campaignSlugFrom, participantUrl, readOrg, type Place } from '@civicos/shared/data/place';
import { placeForConversation } from './place';

/** The fields of a listed Conversation a directory entry is built from. */
export interface DirectoryConversation {
	id: string;
	slug?: string | null;
	title: string;
	shortDescription?: string | null;
	isLive: boolean;
	isPublic: boolean;
	isInviteOnly: boolean;
	isComplete: boolean;
	metadata?: unknown;
}

export interface DirectoryEntry {
	id: string;
	title: string;
	description: string;
	/** Where it runs, when it says. Null is a Campaign served from the apex. */
	place: Place | null;
	/**
	 * Absolute, not a path: a Campaign published to a Place is served only from
	 * that Place's subdomain, and this page is reachable from all of them.
	 */
	url: string;
}

/**
 * Whether a listed Campaign is one a stranger can join.
 *
 * `is_live` is filtered by the backend already and ignored as a query param, so
 * it is re-checked here rather than trusted: this function is also what the
 * tests describe the page's promise with.
 */
function isOpen(conversation: DirectoryConversation): boolean {
	return (
		conversation.isLive &&
		conversation.isPublic &&
		!conversation.isInviteOnly &&
		!conversation.isComplete
	);
}

function toEntry(conversation: DirectoryConversation, apex: string): DirectoryEntry | null {
	const slug = conversation.slug?.trim();
	if (!slug) return null;

	const place = placeForConversation(conversation.id, conversation.metadata);
	const org = readOrg(conversation.metadata);

	// The Conversation is slugged `<campaign>-<place>`, the URL is not: `ai-utah`
	// is served at `utah.bloomproject.us/<org>/conversations/ai`. Matching against
	// this Campaign's own Place slug is the "derive forward, never parse back"
	// rule holding: nothing here splits on a hyphen.
	const campaignSlug = campaignSlugFrom(slug, place ? [place.slug] : []);
	const url = participantUrl(place?.slug ?? '', campaignSlug, org?.slug ?? '', apex);
	if (!url) return null;

	return {
		id: conversation.id,
		title: conversation.title,
		description: conversation.shortDescription?.trim() ?? '',
		place,
		url
	};
}

/**
 * The open Campaigns, addressed and ordered for display. Places first and
 * alphabetically, so a participant scanning for their own town finds it in one
 * pass; the Campaigns with no Place yet sit at the end under one heading.
 */
export function toDirectory(
	conversations: DirectoryConversation[],
	apex: string
): DirectoryEntry[] {
	return conversations
		.filter(isOpen)
		.map((conversation) => toEntry(conversation, apex))
		.filter((entry): entry is DirectoryEntry => entry !== null)
		.sort((a, b) => {
			if (!a.place !== !b.place) return a.place ? -1 : 1;
			const byPlace = (a.place?.name ?? '').localeCompare(b.place?.name ?? '');

			return byPlace !== 0 ? byPlace : a.title.localeCompare(b.title);
		});
}
