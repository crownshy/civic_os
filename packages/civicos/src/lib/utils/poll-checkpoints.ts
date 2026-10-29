import type { AskKey } from '$lib/config/participation';

/** Votes between two checkpoints, and the length of the progress bar. */
export const BATCH_SIZE = 10;

/** Where a participant is in the poll's rhythm of voting and checkpoints. */
export interface VoteProgress {
	totalVotes: number;
	/** Whether a batch has ever been finished. Stored, so a refresh resumes the count. */
	hasSeenPause: boolean;
	/** Votes so far in the current batch. */
	votesInRound: number;
	/**
	 * Index into the asks of the next checkpoint to consider. A cursor, not a
	 * mirror of the list: a Host editing the asks mid-poll changes what it
	 * points at, not where it is.
	 */
	nextCheckpoint: number;
}

/**
 * Pick the poll back up from what this browser stored. Only the vote count
 * is stored, so the checkpoints already shown are approximated from it.
 */
export function resumeProgress(
	totalVotes: number,
	hasSeenPause: boolean,
	askCount: number
): VoteProgress {
	return {
		totalVotes,
		hasSeenPause,
		votesInRound: hasSeenPause ? 0 : totalVotes,
		nextCheckpoint: Math.min(Math.floor(totalVotes / BATCH_SIZE), askCount)
	};
}

export interface VoteOutcome {
	progress: VoteProgress;
	/** The checkpoint to pause on, or null to keep voting. */
	checkpoint: AskKey | null;
}

/**
 * Count one vote Polis recorded, and say whether it ends a batch on a checkpoint.
 *
 * A batch boundary takes the next ask whose action is not already done, rolling
 * past the done ones, so a returning participant who already gave an email sees
 * `contribute, feedback, share` and not a silent gap where the email ask was.
 * Once every ask is used up there are no more pauses, and an empty list (every
 * ask switched off) means voting is never interrupted.
 */
export function recordVote(
	progress: VoteProgress,
	asks: readonly AskKey[],
	isDone: (ask: AskKey) => boolean
): VoteOutcome {
	const counted = {
		...progress,
		totalVotes: progress.totalVotes + 1,
		votesInRound: progress.votesInRound + 1
	};
	if (counted.votesInRound < BATCH_SIZE) return { progress: counted, checkpoint: null };

	let nextCheckpoint = counted.nextCheckpoint;
	while (nextCheckpoint < asks.length && isDone(asks[nextCheckpoint])) nextCheckpoint++;

	const finished = { ...counted, votesInRound: 0, hasSeenPause: true };
	if (nextCheckpoint >= asks.length) {
		return { progress: { ...finished, nextCheckpoint }, checkpoint: null };
	}
	return {
		progress: { ...finished, nextCheckpoint: nextCheckpoint + 1 },
		checkpoint: asks[nextCheckpoint]
	};
}
