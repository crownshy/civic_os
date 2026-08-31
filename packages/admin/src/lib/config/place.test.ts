import { describe, expect, it } from 'vitest';
import { REGIONS, type RegionConfig } from '$lib/config/regions';
import { placeForCampaign, placeFromName, rescopedSlug, toPlaceSlug } from './place';
import { campaignPath, participantUrl } from '@civicos/shared/data/place';

const oregon = REGIONS.oregon as RegionConfig;

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

	it('is null when the name cannot become a subdomain', () => {
		expect(placeFromName('...')).toBeNull();
	});
});

describe('placeForCampaign', () => {
	it('prefers what the Conversation stores', () => {
		const place = placeForCampaign({ place: { slug: 'dundee', name: 'Dundee' } }, oregon);

		expect(place).toEqual({ slug: 'dundee', name: 'Dundee' });
	});

	it('falls back to the legacy region so Utah and Oregon keep their chip', () => {
		expect(placeForCampaign({}, oregon)).toEqual({
			slug: oregon.slug,
			name: oregon.stateName
		});
	});

	it('is null for a backend-only Campaign that has not been given one', () => {
		expect(placeForCampaign({}, null)).toBeNull();
		expect(placeForCampaign(undefined, null)).toBeNull();
	});

	it('ignores a malformed stored place rather than rendering half of one', () => {
		expect(placeForCampaign({ place: { slug: 'dundee' } }, oregon)?.slug).toBe(oregon.slug);
	});
});

describe('rescopedSlug', () => {
	it('scopes a bare slug to the Place it was just given', () => {
		expect(rescopedSlug('ai', '', 'utah')).toBe('ai-utah');
	});

	it('swaps one Place suffix for another instead of stacking them', () => {
		expect(rescopedSlug('ai-utah', 'utah', 'oregon')).toBe('ai-oregon');
	});

	it('strips back to the Campaign slug when the Place is cleared', () => {
		expect(rescopedSlug('ai-utah', 'utah', '')).toBe('ai');
	});

	it('is a no-op when the Place has not moved', () => {
		expect(rescopedSlug('ai-utah', 'utah', 'utah')).toBe('ai-utah');
	});

	it('handles a multi-word Place without mis-splitting the campaign', () => {
		expect(rescopedSlug('ai-central-oregon', 'central-oregon', 'utah')).toBe('ai-utah');
	});

	it('is idempotent on a slug that already ends in the new Place', () => {
		// Setting Place = Dundee on a Conversation slugged `ai-in-dundee` must not
		// double the name up.
		expect(rescopedSlug('ai-in-dundee', '', 'dundee')).toBe('ai-in-dundee');
		expect(rescopedSlug('ai-utah', '', 'utah')).toBe('ai-utah');
	});
});

describe('participantUrl', () => {
	it('builds the ADR 0007 address: place subdomain, org, conversations, slug', () => {
		expect(participantUrl('utah', 'ai', 'Utah Common Ground', 'bloomproject.us')).toBe(
			'https://utah.bloomproject.us/utah-common-ground/conversations/ai'
		);
	});

	it('serves from the apex when the Campaign has no Place', () => {
		// A Campaign has a participant site from creation; a Place gives it a nicer
		// address, not its first one.
		expect(participantUrl('', 'ai', 'Utah Common Ground', 'bloomproject.us')).toBe(
			'https://bloomproject.us/utah-common-ground/conversations/ai'
		);
	});

	it('falls back to a placeholder org rather than dropping the segment', () => {
		// The segment is decorative but structural: the route expects it.
		expect(participantUrl('utah', 'ai', '', 'bloomproject.us')).toBe(
			'https://utah.bloomproject.us/host/conversations/ai'
		);
	});

	it('drops to http on localhost, where there is no TLS', () => {
		expect(participantUrl('dundee', 'ai', 'Bloom', 'localhost:5173')).toBe(
			'http://dundee.localhost:5173/bloom/conversations/ai'
		);
	});

	it('tolerates a base pasted with a scheme or trailing slash', () => {
		expect(participantUrl('utah', 'ai', 'Bloom', 'https://bloomproject.us/')).toBe(
			'https://utah.bloomproject.us/bloom/conversations/ai'
		);
	});

	it('is empty rather than broken without a campaign slug or an apex', () => {
		expect(participantUrl('utah', '', 'Bloom', 'bloomproject.us')).toBe('');
		expect(participantUrl('utah', 'ai', 'Bloom', '')).toBe('');
	});
});

describe('campaignPath', () => {
	it('is the path half of the same rule', () => {
		expect(campaignPath('ai', 'Utah Common Ground')).toBe('/utah-common-ground/conversations/ai');
	});

	it('appends sub-routes', () => {
		expect(campaignPath('ai', 'Bloom', 'contribute')).toBe('/bloom/conversations/ai/contribute');
		expect(campaignPath('ai', 'Bloom', 'events/42')).toBe('/bloom/conversations/ai/events/42');
	});

	it('tolerates the undefined params a component sees', () => {
		expect(campaignPath('ai', undefined)).toBe('/host/conversations/ai');
		expect(campaignPath(undefined, 'Bloom')).toBe('');
	});
});
