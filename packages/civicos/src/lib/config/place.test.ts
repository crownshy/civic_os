import { describe, expect, it } from 'vitest';
import { REGIONS } from '@civicos/shared/data/regions';
import { placeForConversation, placeFromRegion, readPlace, readPoll } from './place';
import { readCoHosts, readOrg } from '@civicos/shared/data/place';
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

describe('readPoll', () => {
	it('reads a mirrored poll identity', () => {
		expect(
			readPoll({
				poll: {
					polisId: '2y2akzkmbb',
					polisUrl: 'https://polis.comhairle.scot',
					question: 'How can Utahns…',
					workflowStepId: '68425b0d-21e9-4f36-8c13-229dab4508bc'
				}
			})
		).toEqual({
			polisId: '2y2akzkmbb',
			polisUrl: 'https://polis.comhairle.scot',
			question: 'How can Utahns…',
			workflowStepId: '68425b0d-21e9-4f36-8c13-229dab4508bc'
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
			readPoll({ poll: { polisId: 'abc', polisUrl: 42, question: null, workflowStepId: ' ' } })
		).toEqual({
			polisId: 'abc'
		});
	});
});

describe('readOrg', () => {
	it('carries the Host site when the mirror recorded one', () => {
		expect(readOrg({ org: { slug: 'cocap', name: 'COCAP', url: 'https://cocap.us/' } })).toEqual({
			slug: 'cocap',
			name: 'COCAP',
			url: 'https://cocap.us/'
		});
	});

	it('leaves the url off rather than empty when the Host has no site', () => {
		// Every Campaign mirrored before CampaignOrg.url existed reads this way,
		// and the event pages drop the "Visit ..." clause instead of printing a
		// dangling one.
		expect(readOrg({ org: { slug: 'cocap', name: 'COCAP' } })).toEqual({
			slug: 'cocap',
			name: 'COCAP'
		});
		expect(readOrg({ org: { slug: 'cocap', name: 'COCAP', url: '  ' } })).toEqual({
			slug: 'cocap',
			name: 'COCAP'
		});
	});
});

describe('readCoHosts', () => {
	it('reads the list admin mirrored, in the order it wrote it', () => {
		expect(
			readCoHosts({
				cohosts: [{ name: 'COCAP', url: 'https://cocap.us/' }, { name: 'Citizens4Community' }]
			})
		).toEqual([{ name: 'COCAP', url: 'https://cocap.us/' }, { name: 'Citizens4Community' }]);
	});

	it('is empty for a Campaign nobody has mirrored', () => {
		// Not the catch-all's partners: that is what credited The Bloom Project on
		// every Campaign created in admin.
		for (const metadata of [null, {}, { cohosts: null }, { cohosts: 'COCAP' }]) {
			expect(readCoHosts(metadata)).toEqual([]);
		}
	});

	it('drops an entry with no name rather than rendering a blank link', () => {
		expect(readCoHosts({ cohosts: [{ url: 'https://example.org' }, { name: '  ' }, 7] })).toEqual(
			[]
		);
	});
});
