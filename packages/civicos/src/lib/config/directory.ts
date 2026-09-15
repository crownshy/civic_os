/**
 * The Campaigns anyone can walk into, for the directory at `/conversations` and
 * for each Place's page at `/<place-slug>`.
 *
 * A 404 used to offer nothing but a link off the product, because there is no
 * single right address to correct someone to (ADR 0007). A directory is the
 * other answer: it does not claim to know which Campaign was meant, it lists
 * the ones that are running and lets the participant pick.
 *
 * Built from `GET /conversation`, which is the only list endpoint the anonymous
 * app can reach and already returns only live Campaigns. It also returns
 * `metadata`, where the Place and the Host are mirrored: the Place is what files
 * a row under a Place page, and the Host fills the `<org>` segment of its link.
 */

import type { ApiClient } from '@crownshy/api-client/api';
import { campaignPath, readOrg, type Place } from '@civicos/shared/data/place';
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
	/** Where it runs, when it says. Null leaves it off every Place page. */
	place: Place | null;
	/**
	 * A path, not an absolute URL. Every host serves every Campaign since the
	 * Place left the hostname, so a link needs no host of its own (ADR 0011).
	 */
	href: string;
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

function toEntry(conversation: DirectoryConversation): DirectoryEntry | null {
	const slug = conversation.slug?.trim();
	if (!slug) return null;

	// The whole Conversation slug, Place suffix included: `ai-utah` is what
	// resolves, and without a subdomain there is nothing else to narrow `ai` by.
	const href = campaignPath(slug, readOrg(conversation.metadata)?.slug);
	if (!href) return null;

	return {
		id: conversation.id,
		title: conversation.title,
		description: conversation.shortDescription?.trim() ?? '',
		place: placeForConversation(conversation.id, conversation.metadata),
		href
	};
}

/**
 * The open Campaigns, addressed and ordered for display. Places first and
 * alphabetically, so a participant scanning for their own town finds it in one
 * pass; the Campaigns with no Place yet sit at the end under one heading.
 */
export function toDirectory(conversations: DirectoryConversation[]): DirectoryEntry[] {
	return conversations
		.filter(isOpen)
		.map(toEntry)
		.filter((entry): entry is DirectoryEntry => entry !== null)
		.sort((a, b) => {
			if (!a.place !== !b.place) return a.place ? -1 : 1;
			const byPlace = (a.place?.name ?? '').localeCompare(b.place?.name ?? '');

			return byPlace !== 0 ? byPlace : a.title.localeCompare(b.title);
		});
}

/** The entries listed under one Place, in directory order. */
export function inPlace(entries: DirectoryEntry[], placeSlug: string): DirectoryEntry[] {
	return entries.filter((entry) => entry.place?.slug === placeSlug);
}

/**
 * Fetch and build the directory. Null when the list could not be fetched,
 * which the pages tell apart from an empty one: both land here from error
 * pages, so neither may 500 on top of what sent someone to it.
 */
export async function listDirectory(
	api: Pick<ApiClient, 'ListConverastions'>
): Promise<DirectoryEntry[] | null> {
	try {
		const { records } = await api.ListConverastions({ queries: { limit: 100 } });
		return toDirectory(records);
	} catch (e) {
		console.warn('[directory] ListConverastions failed', e);
		return null;
	}
}
