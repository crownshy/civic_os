import { describe, expect, it } from 'vitest';
import { REGIONS } from '@civicos/shared/data/regions';
import {
	campaignSlugFrom,
	conversationSlugFor,
	placeForConversation,
	placeFromRegion,
	readPlace,
	readPoll
} from './place';
import type { RegionConfig } from './regions';

const oregon = REGIONS.oregon as RegionConfig;

describe('readPlace', () => {
	it('reads a well-formed place off the metadata', () => {
		expect(readPlace({ place: { slug: 'dundee', name: 'Dundee, Scotland' } })).toEqual({
			slug: 'dundee',
			name: 'Dundee, Scotland'
		});
	});

	it('ignores the rest of the metadata blob', () => {
		const metadata = {
			demographics: { age: true },
			place: { slug: 'dundee', name: 'Dundee, Scotland' }
		};

		expect(readPlace(metadata)?.slug).toBe('dundee');
	});

	it('trims stored whitespace', () => {
		expect(readPlace({ place: { slug: ' dundee ', name: ' Dundee ' } })).toEqual({
			slug: 'dundee',
			name: 'Dundee'
		});
	});

	it('reads as absent when there is no place', () => {
		for (const metadata of [undefined, null, {}, { place: null }, 'dundee', 42]) {
			expect(readPlace(metadata)).toBeNull();
		}
	});

	it('reads as absent when a field is missing, blank, or the wrong type', () => {
		const malformed = [
			{ place: { slug: 'dundee' } },
			{ place: { name: 'Dundee' } },
			{ place: { slug: '', name: 'Dundee' } },
			{ place: { slug: 'dundee', name: '   ' } },
			{ place: { slug: 42, name: 'Dundee' } },
			{ place: { slug: 'dundee', name: ['Dundee'] } }
		];

		for (const metadata of malformed) {
			expect(readPlace(metadata)).toBeNull();
		}
	});
});

describe('placeFromRegion', () => {
	it('derives a place for regions that predate the concept', () => {
		expect(placeFromRegion(oregon)).toEqual({ slug: oregon.slug, name: oregon.stateName });
	});
});

describe('placeForConversation', () => {
	it('prefers the stored place', () => {
		const place = placeForConversation(oregon.conversationId, {
			place: { slug: 'dundee', name: 'Dundee, Scotland' }
		});

		expect(place).toEqual({ slug: 'dundee', name: 'Dundee, Scotland' });
	});

	it('falls back to the legacy region that owns the conversation', () => {
		expect(placeForConversation(oregon.conversationId, {})).toEqual({
			slug: oregon.slug,
			name: oregon.stateName
		});
	});

	it('is null when nothing claims the conversation', () => {
		expect(placeForConversation('7f000000-0000-4000-8000-000000000000', {})).toBeNull();
	});

	it('keys the fallback on the conversation, not the request', () => {
		// Deriving it from the subdomain's region would make every Campaign look
		// like it belonged wherever it was asked for.
		const utah = REGIONS.utah as RegionConfig;

		expect(placeForConversation(utah.conversationId, {})?.slug).toBe(utah.slug);
		expect(placeForConversation(oregon.conversationId, {})?.slug).toBe(oregon.slug);
	});
});

describe('conversationSlugFor', () => {
	it('appends the place so each campaign-place pair gets its own slug', () => {
		expect(conversationSlugFor('ai', 'utah')).toBe('ai-utah');
		expect(conversationSlugFor('ai', 'central-oregon')).toBe('ai-central-oregon');
	});

	it('leaves the slug alone when there is no place to scope it by', () => {
		expect(conversationSlugFor('ai', '')).toBe('ai');
		expect(conversationSlugFor('ai', '   ')).toBe('ai');
	});

	it('does not repeat a place that is already the campaign slug', () => {
		expect(conversationSlugFor('utah', 'utah')).toBe('utah');
	});

	it('is empty without a campaign slug, rather than inventing one from the place', () => {
		expect(conversationSlugFor('', 'utah')).toBe('');
	});
});

describe('campaignSlugFrom', () => {
	const places = ['utah', 'oregon', 'central-oregon', 'all'];

	it('strips a known place suffix', () => {
		expect(campaignSlugFrom('ai-utah', places)).toBe('ai');
	});

	it('prefers the longest matching place, so a nested slug is not mis-split', () => {
		// Splitting on the last hyphen would answer "ai-central", which is why
		// this matches against known places instead of parsing the string.
		expect(campaignSlugFrom('ai-central-oregon', places)).toBe('ai');
	});

	it('leaves a slug carrying no known place alone', () => {
		expect(campaignSlugFrom('ai-in-dundee', places)).toBe('ai-in-dundee');
		expect(campaignSlugFrom('ai', places)).toBe('ai');
	});

	it('groups a campaign back together across its places', () => {
		const slugs = ['ai-utah', 'ai-oregon', 'ai-all'];

		expect(new Set(slugs.map((s) => campaignSlugFrom(s, places)))).toEqual(new Set(['ai']));
	});
});

describe('readPoll', () => {
	it('reads a mirrored poll identity', () => {
		expect(
			readPoll({
				poll: {
					polisId: '2y2akzkmbb',
					polisUrl: 'https://polis.comhairle.scot',
					question: 'How can Utahns…'
				}
			})
		).toEqual({
			polisId: '2y2akzkmbb',
			polisUrl: 'https://polis.comhairle.scot',
			question: 'How can Utahns…'
		});
	});

	it('needs only the polis id, since the rest have app-level fallbacks', () => {
		expect(readPoll({ poll: { polisId: '2y2akzkmbb' } })).toEqual({ polisId: '2y2akzkmbb' });
	});

	it('sits alongside the place without either reading the other', () => {
		const metadata = {
			place: { slug: 'dundee', name: 'Dundee, Scotland' },
			poll: { polisId: '2y2akzkmbb' }
		};

		expect(readPoll(metadata)?.polisId).toBe('2y2akzkmbb');
		expect(readPlace(metadata)?.slug).toBe('dundee');
	});

	it('reads as absent without a usable polis id, so the caller falls back', () => {
		// A half-written poll must not shadow the regions.ts value: serving a
		// Campaign against a blank Polis id is worse than serving the legacy one.
		for (const metadata of [
			undefined,
			null,
			{},
			{ poll: null },
			{ poll: {} },
			{ poll: { polisId: '' } },
			{ poll: { polisId: '   ' } },
			{ poll: { polisId: 42 } },
			{ poll: { polisUrl: 'https://polis.example', question: 'q' } }
		]) {
			expect(readPoll(metadata)).toBeNull();
		}
	});

	it('drops malformed optional fields rather than the whole poll', () => {
		expect(
			readPoll({ poll: { polisId: 'abc', polisUrl: 42, inviteId: '', question: null } })
		).toEqual({ polisId: 'abc' });
	});
});
