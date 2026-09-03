import { describe, expect, it } from 'vitest';
import { NAV_BAR_STEPS, NAV_SEQUENCE, navBarStateFor, stepFrom } from './nav';

describe('the walk through the report', () => {
	it('runs title → demographics → groups → consensus → themes', () => {
		expect(NAV_SEQUENCE).toEqual(['title', 'demogs', 'groups', 'consensus', 'themes']);
	});

	it('counts only the steps the bar is shown on, so title is not one of them', () => {
		expect(NAV_BAR_STEPS).not.toContain('title');
		expect(NAV_BAR_STEPS).toHaveLength(4);
	});
});

describe('navBarStateFor', () => {
	it('hides the bar on the title page', () => {
		expect(navBarStateFor('title')).toBeNull();
	});

	it('hides the bar on a single theme page, which is outside the walk', () => {
		expect(navBarStateFor('governance')).toBeNull();
	});

	it('numbers the first bar step 1 of 4, not 2 of 5', () => {
		expect(navBarStateFor('demogs')).toEqual({
			label: 'Who participated?',
			step: 1,
			total: 4,
			progress: 25,
			atEnd: false
		});
	});

	it('fills the progress bar on the last step and stops there', () => {
		expect(navBarStateFor('themes')).toMatchObject({
			step: 4,
			total: 4,
			progress: 100,
			atEnd: true
		});
	});
});

describe('stepFrom', () => {
	it('advances and retreats through the sequence', () => {
		expect(stepFrom('title', 1)).toBe('demogs');
		expect(stepFrom('groups', -1)).toBe('demogs');
	});

	it('has nowhere to go past either end', () => {
		expect(stepFrom('title', -1)).toBeNull();
		expect(stepFrom('themes', 1)).toBeNull();
	});

	it('has no neighbours for a key outside the sequence', () => {
		expect(stepFrom('governance', 1)).toBeNull();
	});
});
