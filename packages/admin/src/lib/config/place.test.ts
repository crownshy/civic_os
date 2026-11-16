import { describe, expect, it } from 'vitest';
import {
	CAMPAIGN_PAGES,
	campaignPath,
	participantUrl,
	placeFromName,
	placePath,
	toPlaceSlug
} from '@civicos/shared/data/place';

describe('toPlaceSlug', () => {
	it('turns a display name into a DNS label', () => {
		expect(toPlaceSlug('Dundee, Scotland')).toBe('dundee-scotland');
		expect(toPlaceSlug('Oregon')).toBe('oregon');
	});

	it('folds accents rather than dropping the letter', () => {
		expect(toPlaceSlug('Córdoba')).toBe('cordoba');
		expect(toPlaceSlug('Malmö')).toBe('malmo');
	});

	it('collapses runs of punctuation and trims the edges', () => {
		expect(toPlaceSlug('  St. John’s / Nfld.  ')).toBe('st-john-s-nfld');
		expect(toPlaceSlug('---Utah---')).toBe('utah');
	});

	it('is empty when there is nothing a label can be built from', () => {
		for (const name of ['', '   ', '...', '日本']) {
			expect(toPlaceSlug(name)).toBe('');
		}
	});

	it('stays inside the 63-character DNS label limit, without a trailing hyphen', () => {
		const slug = toPlaceSlug(`${'a'.repeat(62)} bcdef`);

		expect(slug.length).toBeLessThanOrEqual(63);
		expect(slug.endsWith('-')).toBe(false);
	});
});

describe('placeFromName', () => {
	it('pairs the trimmed name with its derived slug', () => {
		expect(placeFromName('  Dundee, Scotland  ')).toEqual({
			slug: 'dundee-scotland',
			name: 'Dundee, Scotland'
		});
	});

	it('is null when the name cannot become a slug', () => {
		expect(placeFromName('...')).toBeNull();
	});
});

describe('participantUrl', () => {
	it('builds the ADR 0014 address: the conversation slug off the root', () => {
		expect(participantUrl('ai-utah', 'bloomproject.us')).toBe('https://bloomproject.us/ai-utah');
	});

	it('serves every Campaign from the configured host, with no Place label', () => {
		// A subdomain per Place needed a certificate and a Polis allowlist entry each.
		expect(new URL(participantUrl('ai-utah', 'stage.bloomproject.us')).host).toBe(
			'stage.bloomproject.us'
		);
	});

	it('drops to http on localhost, where there is no TLS', () => {
		expect(participantUrl('ai-dundee', 'localhost:5173')).toBe('http://localhost:5173/ai-dundee');
	});

	it('tolerates a base pasted with a scheme or trailing slash', () => {
		expect(participantUrl('ai-utah', 'https://bloomproject.us/')).toBe(
			'https://bloomproject.us/ai-utah'
		);
	});

	it('is empty rather than broken without a slug or a host', () => {
		expect(participantUrl('', 'bloomproject.us')).toBe('');
		expect(participantUrl('ai-utah', '')).toBe('');
	});
});

describe('placePath', () => {
	it('is the Place page, one segment off the root', () => {
		expect(placePath('dundee-scotland')).toBe('/dundee-scotland');
	});

	it('is empty for a Campaign with no Place', () => {
		expect(placePath('')).toBe('');
		expect(placePath(undefined)).toBe('');
	});
});

describe('campaignPath', () => {
	it('is the path half of the same rule', () => {
		expect(campaignPath('ai-utah')).toBe('/ai-utah');
	});

	it('appends the pages under a Campaign', () => {
		expect(campaignPath('ai', CAMPAIGN_PAGES.poll)).toBe('/ai/poll');
		expect(campaignPath('ai', CAMPAIGN_PAGES.events, '42')).toBe('/ai/events/42');
	});

	it('tolerates the undefined params a component sees', () => {
		expect(campaignPath(undefined)).toBe('');
		expect(campaignPath('ai', '')).toBe('/ai');
	});
});
