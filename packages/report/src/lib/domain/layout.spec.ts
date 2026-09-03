import { describe, expect, it } from 'vitest';
import { nudgeApart } from './layout';

describe('nudgeApart', () => {
	it('separates positions that would otherwise overlap', () => {
		expect(nudgeApart([10, 10, 10], 5, 0, 100)).toEqual([10, 15, 20]);
	});

	it('leaves positions that already clear the gap alone', () => {
		expect(nudgeApart([10, 50, 90], 5, 0, 100)).toEqual([10, 50, 90]);
	});

	it('pulls the run back inside the upper bound', () => {
		// pushing right would put the second past hi, so both come back in
		expect(nudgeApart([98, 99], 5, 0, 100)).toEqual([95, 100]);
	});

	it('keeps each result with the input it came from, not with sorted order', () => {
		// positions arrive in group order, so index 0 must stay the rightmost here
		expect(nudgeApart([90, 10], 5, 0, 100)).toEqual([90, 10]);
	});

	it('respects the lower bound', () => {
		expect(nudgeApart([-20], 5, 0, 100)).toEqual([0]);
	});

	it('handles a single position and an empty list', () => {
		expect(nudgeApart([50], 10, 0, 100)).toEqual([50]);
		expect(nudgeApart([], 10, 0, 100)).toEqual([]);
	});
});
