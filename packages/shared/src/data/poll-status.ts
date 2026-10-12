/**
 * An Open Poll's status, as both apps read it (#443).
 *
 * comhairle has no status field, only flags, so this is derived:
 * `is_live` says the poll has launched, `is_complete` says it is done, and
 * paused rides on `metadata` because comhairle has no flag for it.
 */
export type PollStatus = 'draft' | 'live' | 'paused' | 'complete';

/**
 * Its own top-level key, not a field on `metadata.poll`: the metadata patch is
 * a shallow merge, and admin rewrites the whole `poll` object every time it
 * mirrors the poll identity, which would silently unpause the poll.
 */
export const POLL_PAUSED_METADATA_KEY = 'pollPaused';

export function readPollPaused(metadata: unknown): boolean {
	if (typeof metadata !== 'object' || metadata === null) return false;
	return (metadata as Record<string, unknown>)[POLL_PAUSED_METADATA_KEY] === true;
}

interface PollFlags {
	isLive: boolean;
	isComplete: boolean;
	metadata?: unknown;
}

export function pollStatusFor({ isLive, isComplete, metadata }: PollFlags): PollStatus {
	if (isComplete) return 'complete';
	if (!isLive) return 'draft';
	if (readPollPaused(metadata)) return 'paused';
	return 'live';
}
