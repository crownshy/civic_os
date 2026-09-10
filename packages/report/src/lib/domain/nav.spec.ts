import { describe, expect, it } from 'vitest';
import { navBarStateFor, stepFrom } from './nav';

describe('navBarStateFor', () => {
	it('hides the bar on the title page', () => {
		expect(navBarStateFor('title')).toBeNull();
	});

	it('hides the bar on a single theme page, which is outside the walk', () => {
		expect(navBarStateFor('governance')).toBeNull();
	});

	it('numbers the first bar step 1 of 5, not 2 of 6', () => {
		expect(navBarStateFor('demogs')).toEqual({
			label: 'Who participated?',
			step: 1,
			total: 5,
			progress: 20,
			atEnd: false
		});
	});

	it('counts the call to action as a step of its own', () => {
		expect(navBarStateFor('cta')).toMatchObject({ label: 'Call to Action', step: 4, total: 5 });
	});

	it('fills the progress bar on the last step and stops there', () => {
		expect(navBarStateFor('themes')).toMatchObject({
			step: 5,
			total: 5,
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

	it('walks from consensus through the call to action to the theme grid', () => {
		expect(stepFrom('consensus', 1)).toBe('cta');
		expect(stepFrom('cta', 1)).toBe('themes');
	});

	it('has nowhere to go past either end', () => {
		expect(stepFrom('title', -1)).toBeNull();
		expect(stepFrom('themes', 1)).toBeNull();
	});

	it('has no neighbours for a key outside the sequence', () => {
		expect(stepFrom('governance', 1)).toBeNull();
	});
});
