/**
 * The ordered walk through the report, and the state of the bar that drives it.
 *
 * This array is the single source of truth for that order: reordering,
 * inserting or removing a step is a one-line change here.
 */

/** The intro sequence shown before the theme grid. */
export const INTRO_STEPS = ['title', 'demogs', 'groups', 'consensus'] as const;

/** Intro steps plus the theme grid they lead into. */
export const NAV_SEQUENCE = [...INTRO_STEPS, 'themes'] as const;

export type StepKey = (typeof NAV_SEQUENCE)[number];

/**
 * A step with no label hides the bar entirely; that is the title page, and
 * any single-theme page, neither of which is part of the counted walk.
 */
export const NAV_BAR_LABELS: Partial<Record<StepKey, string>> = {
	demogs: 'Who participated?',
	groups: 'Opinion Groups',
	consensus: 'Consensus',
	themes: 'Data Explorer'
};

/**
 * The X/Y step count and progress fill are measured against just the
 * bar-visible steps, not all of NAV_SEQUENCE (which also carries 'title').
 */
export const NAV_BAR_STEPS = NAV_SEQUENCE.filter((key) => NAV_BAR_LABELS[key]);

export function isStepKey(key: string): key is StepKey {
	return (NAV_SEQUENCE as readonly string[]).includes(key);
}

export interface NavBarState {
	label: string;
	/** 1-based position among the bar-visible steps */
	step: number;
	total: number;
	/** 0–100, for the progress fill */
	progress: number;
	/** the last step in the whole sequence has nowhere further to go */
	atEnd: boolean;
}

/** The bar's contents for a step, or null when the bar should be hidden. */
export function navBarStateFor(key: string): NavBarState | null {
	if (!isStepKey(key)) return null;
	const label = NAV_BAR_LABELS[key];
	if (!label) return null;

	const step = NAV_BAR_STEPS.indexOf(key) + 1;
	const total = NAV_BAR_STEPS.length;
	return {
		label,
		step,
		total,
		progress: (step / total) * 100,
		atEnd: NAV_SEQUENCE.indexOf(key) === NAV_SEQUENCE.length - 1
	};
}

/**
 * The step `delta` places from `key`, or null at either end. Used by the bar's
 * back and next buttons; a key outside the sequence has no neighbours.
 */
export function stepFrom(key: string, delta: number): StepKey | null {
	if (!isStepKey(key)) return null;
	const index = NAV_SEQUENCE.indexOf(key) + delta;
	return NAV_SEQUENCE[index] ?? null;
}
