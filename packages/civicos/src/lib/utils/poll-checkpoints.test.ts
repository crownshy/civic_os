import { describe, expect, it } from 'vitest';
import type { AskKey } from '$lib/config/participation';
import { BATCH_SIZE, recordVote, resumeProgress, type VoteProgress } from './poll-checkpoints';

const ALL_ASKS: AskKey[] = ['contribute', 'email', 'feedback', 'share'];
const nothingDone = () => false;

/** Vote `count` times, collecting every checkpoint that came up on the way. */
function vote(
	progress: VoteProgress,
	count: number,
	asks: AskKey[] = ALL_ASKS,
	isDone: (ask: AskKey) => boolean = nothingDone
) {
	const checkpoints: AskKey[] = [];
	for (let i = 0; i < count; i++) {
		const outcome = recordVote(progress, asks, isDone);
		progress = outcome.progress;
		if (outcome.checkpoint) checkpoints.push(outcome.checkpoint);
	}
	return { progress, checkpoints };
}

describe('resumeProgress', () => {
	it('starts a new participant at zero', () => {
		expect(resumeProgress(0, false, 4)).toEqual({
			totalVotes: 0,
			hasSeenPause: false,
			votesInRound: 0,
			nextCheckpoint: 0
		});
	});

	it('carries the votes into the first batch until a pause has been seen', () => {
		expect(resumeProgress(7, false, 4).votesInRound).toBe(7);
		expect(resumeProgress(27, true, 4).votesInRound).toBe(0);
	});

	it('approximates the checkpoints already shown from the vote count', () => {
		expect(resumeProgress(27, true, 4).nextCheckpoint).toBe(2);
	});

	it('never points past the asks there are', () => {
		expect(resumeProgress(90, true, 2).nextCheckpoint).toBe(2);
	});
});

describe('recordVote', () => {
	it('keeps voting inside a batch', () => {
		const { progress, checkpoints } = vote(resumeProgress(0, false, 4), BATCH_SIZE - 1);
		expect(checkpoints).toEqual([]);
		expect(progress.totalVotes).toBe(BATCH_SIZE - 1);
		expect(progress.hasSeenPause).toBe(false);
	});

	it('pauses on each ask in order, one per batch', () => {
		const { checkpoints } = vote(resumeProgress(0, false, 4), BATCH_SIZE * 4);
		expect(checkpoints).toEqual(['contribute', 'email', 'feedback', 'share']);
	});

	it('starts a new batch and remembers the pause', () => {
		const { progress } = vote(resumeProgress(0, false, 4), BATCH_SIZE);
		expect(progress.votesInRound).toBe(0);
		expect(progress.hasSeenPause).toBe(true);
	});

	it('stops pausing once every ask is used', () => {
		const { checkpoints } = vote(resumeProgress(0, false, 4), BATCH_SIZE * 6);
		expect(checkpoints).toHaveLength(4);
	});

	it('rolls past an ask whose action is already done', () => {
		const emailGiven = (ask: AskKey) => ask === 'email';
		const { checkpoints } = vote(resumeProgress(0, false, 4), BATCH_SIZE * 3, ALL_ASKS, emailGiven);
		expect(checkpoints).toEqual(['contribute', 'feedback', 'share']);
	});

	it('never interrupts when every ask is switched off', () => {
		const { progress, checkpoints } = vote(resumeProgress(0, false, 0), BATCH_SIZE * 3, []);
		expect(checkpoints).toEqual([]);
		expect(progress.totalVotes).toBe(BATCH_SIZE * 3);
	});

	it('resumes a returning participant at the ask after the ones they saw', () => {
		const { checkpoints } = vote(resumeProgress(BATCH_SIZE * 2, true, 4), BATCH_SIZE * 2);
		expect(checkpoints).toEqual(['feedback', 'share']);
	});

	it('copes with the Host switching asks off mid-poll', () => {
		const start = vote(resumeProgress(0, false, 4), BATCH_SIZE * 3).progress;
		const { checkpoints } = vote(start, BATCH_SIZE, ['contribute']);
		expect(checkpoints).toEqual([]);
	});
});
