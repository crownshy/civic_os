/**
 * How a statement's vote spread is summarised into a single badge.
 */

import type { Vote } from './types';

export const DIFFERENCE_OVER_GAP = 33;
export const CONSENSUS_OVER_AGREE = 66;
export const CONSENSUS_UNDER_AGREE = 33;

export type VerdictKind = 'difference' | 'consensus' | 'consensus-against' | 'neutral';

export interface Verdict {
	kind: VerdictKind;
	label: string;
	/** which icon to show, by name; the component owns the asset URL */
	icon: 'difference' | 'consensus' | null;
}

/**
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

export function tierColorFor(pct: number): string {
	if (pct >= 67) return 'var(--agree)';
	if (pct >= 33) return 'var(--amber)';
	return 'var(--disagree)';
}
