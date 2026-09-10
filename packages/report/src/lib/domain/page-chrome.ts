/**
 * What surrounds each step's content: the page colour, which also fills the
 * strips reserved under the top and bottom bars and the desktop gutter, the
 * top bar's text colour, and the accent `--c` the page and its modals read.
 */

import { isStepKey, type StepKey } from './nav';
import type { Theme } from './types';

export interface PageChrome {
	background: string;
	/** the faint hairline grid over the background */
	grid: boolean;
	/** null means the step has no top bar */
	topBarText: string | null;
	accent: string;
}

const PAPER = { background: 'var(--paper)', grid: true } as const;

const STEP_CHROME = {
	title: { ...PAPER, topBarText: 'var(--theme-blue)', accent: 'var(--home)' },
	demogs: { background: 'var(--home)', grid: false, topBarText: '#fff', accent: 'var(--home)' },
	groups: { ...PAPER, topBarText: 'var(--home)', accent: 'var(--home)' },
	consensus: {
		background: 'color-mix(in srgb, var(--agree) 88%, #000)',
		grid: false,
		topBarText: '#fff',
		accent: 'var(--agree)'
	},
	themes: { ...PAPER, topBarText: 'var(--theme-blue)', accent: 'var(--home)' }
} satisfies Record<StepKey, PageChrome>;

/** A single theme page has no top bar: its own sticky nav is the only bar it carries. */
export function chromeFor(step: string, theme?: Theme): PageChrome {
	if (theme) return { ...PAPER, topBarText: null, accent: theme.color };
	return isStepKey(step) ? STEP_CHROME[step] : STEP_CHROME.title;
}
