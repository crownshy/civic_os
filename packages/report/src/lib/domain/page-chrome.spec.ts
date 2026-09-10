import { describe, expect, it } from 'vitest';
import { chromeFor } from './page-chrome';
import type { Theme } from './types';

const theme: Theme = { key: 'governance', short: 'G', full: 'G', color: '#17348C', tags: [] };

describe('chromeFor', () => {
	it('puts the title page on the grid with blue top-bar text', () => {
		expect(chromeFor('title')).toMatchObject({
			background: 'var(--paper)',
			grid: true,
			topBarText: 'var(--theme-blue)'
		});
	});

	it('gives the consensus page its darker green and the agree accent', () => {
		expect(chromeFor('consensus')).toMatchObject({
			background: 'color-mix(in srgb, var(--agree) 88%, #000)',
			grid: false,
			accent: 'var(--agree)'
		});
	});

	it('puts the call to action on the theme blue with white top-bar text', () => {
		expect(chromeFor('cta')).toMatchObject({
			background: 'var(--theme-blue)',
			grid: false,
			topBarText: '#fff'
		});
	});

	it('drops the top bar on a single theme page and takes the theme colour as accent', () => {
		expect(chromeFor('governance', theme)).toEqual({
			background: 'var(--paper)',
			grid: true,
			topBarText: null,
			accent: '#17348C'
		});
	});

	it('falls back to the title page for a step it does not know', () => {
		expect(chromeFor('nowhere')).toEqual(chromeFor('title'));
	});
});
