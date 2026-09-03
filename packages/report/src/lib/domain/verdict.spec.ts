import { describe, expect, it } from 'vitest';
import {
	CONSENSUS_OVER_AGREE,
	CONSENSUS_UNDER_AGREE,
	DIFFERENCE_OVER_GAP,
	tierColorFor,
	verdictFor
} from './verdict';
import type { Vote } from './types';

const vote = (minAgree: number, gap: number): Vote => ({ minAgree, gap, total: 100 }) as Vote;

describe('verdictFor', () => {
	it('reports a wide spread as a difference, quoting the gap', () => {
		expect(verdictFor(vote(50, 40))).toEqual({
			kind: 'difference',
			icon: 'difference',
			label: 'DIFFERENCE (40 PTS)'
		});
	});

	it('reports broad agreement as consensus, quoting the least-agreeing group', () => {
		expect(verdictFor(vote(84, 14))).toEqual({
			kind: 'consensus',
			icon: 'consensus',
			label: 'CONSENSUS (84% AGREE)'
		});
	});

	it('reports broad rejection as consensus too, quoting the most-agreeing group', () => {
		// minAgree 10 + gap 20 = a ceiling of 30, below CONSENSUS_UNDER_AGREE
		expect(verdictFor(vote(10, 20))).toEqual({
			kind: 'consensus-against',
			icon: 'consensus',
			label: 'CONSENSUS (30% AGREE)'
		});
	});

	it('falls back to the bare agree% with no icon', () => {
		expect(verdictFor(vote(50, 10))).toEqual({
			kind: 'neutral',
			icon: null,
			label: '50% AGREE'
		});
	});

	it('calls a wide gap a difference even when agreement is otherwise high', () => {
		// order matters: the disagreement is the more interesting fact, so this
		// must not be reported as consensus despite minAgree clearing the bar
		expect(verdictFor(vote(70, 40)).kind).toBe('difference');
	});

	describe('thresholds are exclusive', () => {
		it(`a gap of exactly ${DIFFERENCE_OVER_GAP} is not a difference`, () => {
			expect(verdictFor(vote(50, DIFFERENCE_OVER_GAP)).kind).not.toBe('difference');
		});

		it(`agreement of exactly ${CONSENSUS_OVER_AGREE} is not consensus`, () => {
			expect(verdictFor(vote(CONSENSUS_OVER_AGREE, 0)).kind).toBe('neutral');
		});

		it(`a ceiling of exactly ${CONSENSUS_UNDER_AGREE} is not consensus-against`, () => {
			expect(verdictFor(vote(CONSENSUS_UNDER_AGREE, 0)).kind).toBe('neutral');
		});

		it('one point past each threshold does flip it', () => {
			expect(verdictFor(vote(50, DIFFERENCE_OVER_GAP + 1)).kind).toBe('difference');
			expect(verdictFor(vote(CONSENSUS_OVER_AGREE + 1, 0)).kind).toBe('consensus');
			expect(verdictFor(vote(CONSENSUS_UNDER_AGREE - 1, 0)).kind).toBe('consensus-against');
		});
	});
});

describe('tierColorFor', () => {
	it.each([
		[0, 'var(--disagree)'],
		[32, 'var(--disagree)'],
		[33, 'var(--amber)'],
		[66, 'var(--amber)'],
		[67, 'var(--agree)'],
		[100, 'var(--agree)']
	])('colours %i%% by how high it is, not whose it is', (pct, expected) => {
		expect(tierColorFor(pct)).toBe(expected);
	});
});
