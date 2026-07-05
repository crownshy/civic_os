import { describe, it, expect } from 'vitest';
import type { GroupVote, ReportComment, ReportGroup } from '$lib/types/report';
import { minGroupVotes, isLowQuality, classifyStatement } from './report';

/** Build a ReportComment from per-group [agrees, disagrees, passes] tuples. */
function comment(groupVotes: [number, number, number][]): ReportComment {
	const group_votes: GroupVote[] = groupVotes.map(([agrees, disagrees, passes], group_id) => ({
		group_id,
		agrees,
		disagrees,
		passes
	}));
	const overall = group_votes.reduce(
		(o, g) => ({
			agrees: o.agrees + g.agrees,
			disagrees: o.disagrees + g.disagrees,
			passes: o.passes + g.passes
		}),
		{ agrees: 0, disagrees: 0, passes: 0 }
	);
	return {
		tid: 0,
		text: 't',
		overall_votes: overall,
		group_votes,
		group_informed_consensus: 0,
		divisiveness: 0
	};
}

const groups = (n: number): ReportGroup[] =>
	Array.from({ length: n }, (_, group_id) => ({
		group_id,
		representative_comments: [],
		members: [],
		total_members: 100
	}));

describe('minGroupVotes', () => {
	it('is the fewest votes any single group cast', () => {
		expect(minGroupVotes(comment([[5, 2, 1], [10, 0, 0]]))).toBe(8);
	});
	it('is 0 when a comment has no group votes', () => {
		expect(minGroupVotes(comment([]))).toBe(0);
	});
});

describe('isLowQuality (any group < 10 votes)', () => {
	it('is low quality when the thinnest group is under 10', () => {
		expect(isLowQuality(comment([[9, 0, 0], [50, 0, 0]]))).toBe(true);
	});
	it('is not low quality when every group has 10+', () => {
		expect(isLowQuality(comment([[10, 0, 0], [4, 4, 2]]))).toBe(false);
	});
});

describe('classifyStatement', () => {
	it('flags consensus when every group agrees ≥ 80%', () => {
		// group0 = 9/10 = 90%, group1 = 16/20 = 80%
		expect(classifyStatement(comment([[9, 0, 1], [16, 0, 4]]), groups(2))).toBe('consensus');
	});
	it('flags difference when the group agree% spread exceeds 30', () => {
		// group0 = 18/20 = 90%, group1 = 2/20 = 10% → spread 80
		expect(classifyStatement(comment([[18, 0, 2], [2, 16, 2]]), groups(2))).toBe('difference');
	});
	it('is neutral when neither consensus nor difference', () => {
		// group0 = 60%, group1 = 50% → spread 10, not all ≥80
		expect(classifyStatement(comment([[12, 6, 2], [10, 8, 2]]), groups(2))).toBe('neutral');
	});
});
