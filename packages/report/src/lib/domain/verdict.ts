/**
 * How a statement's vote spread is summarised into a single badge.
 *
 * These thresholds are this report's own, not Polis concepts. Note that
 * `packages/admin/src/lib/utils/report.ts` classifies the same way for the
 * live report with *different* numbers (80/20/30). Converging them would
 * reclassify statements, which is an editorial decision rather than a
 * refactoring one.
 */

import type { Vote } from './types';

/** gap wider than this → the groups disagree with each other */
export const DIFFERENCE_OVER_GAP = 33;
/** even the least-agreeing group is above this → consensus in favour */
export const CONSENSUS_OVER_AGREE = 66;
/** even the most-agreeing group is below this → consensus against */
export const CONSENSUS_UNDER_AGREE = 33;

export type VerdictKind = 'difference' | 'consensus' | 'consensus-against' | 'neutral';

export interface Verdict {
	kind: VerdictKind;
	label: string;
	/** which icon to show, by name; the component owns the asset URL */
	icon: 'difference' | 'consensus' | null;
}

/**
 * Shared by the statement card's badge and the statement modal's.
 *
 * Order matters: a wide gap is reported as a difference even when the ceiling
 * is high, because the disagreement is the more interesting fact.
 */
export function verdictFor(vote: Vote): Verdict {
	// gap is max − min, so the ceiling needs no field of its own
	const maxAgree = vote.minAgree + vote.gap;

	if (vote.gap > DIFFERENCE_OVER_GAP) {
		return { kind: 'difference', icon: 'difference', label: `DIFFERENCE (${vote.gap} PTS)` };
	}
	if (vote.minAgree > CONSENSUS_OVER_AGREE) {
		return { kind: 'consensus', icon: 'consensus', label: `CONSENSUS (${vote.minAgree}% AGREE)` };
	}
	if (maxAgree < CONSENSUS_UNDER_AGREE) {
		return {
			kind: 'consensus-against',
			icon: 'consensus',
			label: `CONSENSUS (${maxAgree}% AGREE)`
		};
	}
	return { kind: 'neutral', icon: null, label: `${vote.minAgree}% AGREE` };
}

/**
 * The card's per-group %-agree readout is coloured by how high it is, not by
 * which group it belongs to: 0–33 red, 33–67 amber, 67–100 green.
 */
export function tierColorFor(pct: number): string {
	if (pct >= 67) return 'var(--agree)';
	if (pct >= 33) return 'var(--amber)';
	return 'var(--disagree)';
}
