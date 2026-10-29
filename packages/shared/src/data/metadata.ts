import type { Api } from '../api';
import type { AskToggles } from './participant-asks';
import { COLOR_SCHEME_METADATA_KEY } from './color-scheme';
import { POLL_PAUSED_METADATA_KEY } from './poll-status';
import {
	COHOSTS_METADATA_KEY,
	ORG_METADATA_KEY,
	PLACE_METADATA_KEY,
	POLL_METADATA_KEY,
	readPoll,
	type CampaignCoHost,
	type CampaignOrg,
	type CampaignPoll,
	type Place
} from './place';

/**
 * Everything admin writes into `Conversation.metadata`, one typed field per
 * key. Leave a field out to leave that key alone.
 */
export interface MetadataWrites {
	place?: Place | null;
	/** Merged over the stored poll, so a write only ever adds to it. */
	poll?: Partial<CampaignPoll>;
	org?: CampaignOrg | null;
	cohosts?: CampaignCoHost[];
	/** A `COLOR_SCHEMES` id. */
	colorScheme?: string | null;
	participantAsks?: AskToggles;
	pollPaused?: boolean;
}

export type MetadataApi = Pick<Api, 'GetConversation' | 'PatchConversationMetadata'>;

/**
 * Write the given keys in one patch.
 *
 * Comhairle merges a patch at the top level and replaces each key wholesale, so
 * a poll built from part of what is known would drop the rest (the Key
 * Question, the workflow step). The poll is therefore merged over the stored
 * one, read fresh here rather than taken from a caller that may hold a stale
 * copy. A poll that still has no `polisId` after the merge is not written:
 * civicos would read it as no poll at all.
 */
export async function writeMetadata(
	api: MetadataApi,
	conversationId: string,
	writes: MetadataWrites
): Promise<void> {
	const params = { params: { conversation_id: conversationId } };
	const body: Record<string, unknown> = {};

	if (writes.place !== undefined) body[PLACE_METADATA_KEY] = writes.place;
	if (writes.org !== undefined) body[ORG_METADATA_KEY] = writes.org;
	if (writes.cohosts !== undefined) body[COHOSTS_METADATA_KEY] = writes.cohosts;
	if (writes.colorScheme !== undefined) body[COLOR_SCHEME_METADATA_KEY] = writes.colorScheme;
	if (writes.participantAsks !== undefined) body.participantAsks = writes.participantAsks;
	if (writes.pollPaused !== undefined) body[POLL_PAUSED_METADATA_KEY] = writes.pollPaused;

	if (writes.poll !== undefined) {
		const stored = await api.GetConversation(params);
		const poll = { ...readPoll(stored?.metadata), ...withoutUndefined(writes.poll) };
		if (poll.polisId) body[POLL_METADATA_KEY] = poll;
	}

	if (Object.keys(body).length === 0) return;
	await api.PatchConversationMetadata(body, params);
}

function withoutUndefined<T extends object>(value: T): Partial<T> {
	return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
