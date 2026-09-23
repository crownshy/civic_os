import { describe, expect, it } from 'vitest';
import { GENERIC_REGION, REGIONS } from '@civicos/shared/data/regions';
import {
	campaignCandidates,
	legacyRegionForSlug,
	placeNameFor,
	pollFor,
	regionForCampaign,
	resolveCampaign
} from './campaign';
import type { RegionConfig } from './regions';
import { toPlaceSlug } from './place';

const oregon = REGIONS.oregon as RegionConfig;

const stored = {
	id: 'c0ffee00-0000-4000-8000-000000000000',
	slug: 'ai-in-dundee',
	title: 'AI and the Future of Dundee',
	metadata: { place: { slug: 'dundee', name: 'Dundee, Scotland' } }
};

describe('campaignCandidates', () => {
	it('resolves a legacy region slug to its hardcoded id first', () => {
		expect(campaignCandidates('oregon')).toEqual([oregon.conversationId, 'oregon']);
	});

	it('tries a stored slug directly, Place suffix and all', () => {
		expect(campaignCandidates('ai-in-dundee')).toEqual(['ai-in-dundee']);
	});

	it('never offers a region id for a slug no region names', () => {
		expect(campaignCandidates('ai-in-dundee')).not.toContain(GENERIC_REGION.conversationId);
	});

	it('resolves the catch-all slug to its id', () => {
		expect(campaignCandidates(GENERIC_REGION.slug)).toEqual([
			GENERIC_REGION.conversationId,
			GENERIC_REGION.slug
		]);
	});

	it('does not read an inherited key as a region', () => {
		expect(campaignCandidates('constructor')).toEqual(['constructor']);
	});

	it('drops a blank slug', () => {
		expect(campaignCandidates('   ')).toEqual([]);
	});
});

describe('legacyRegionForSlug', () => {
	it('names the legacy regions and the catch-all', () => {
		expect(legacyRegionForSlug('oregon')).toBe(oregon);
		expect(legacyRegionForSlug(GENERIC_REGION.slug)).toBe(GENERIC_REGION);
	});

	it('is null for anything else, including an empty subdomain', () => {
		expect(legacyRegionForSlug('stage')).toBeNull();
		expect(legacyRegionForSlug('')).toBeNull();
	});
});

describe('regionForCampaign', () => {
	it('takes the region that owns the Conversation, whatever the slug', () => {
		expect(regionForCampaign(oregon.conversationId, 'renamed')).toBe(oregon);
	});

	it('falls back to the region the slug names when nothing resolved', () => {
		expect(regionForCampaign(null, 'oregon')).toBe(oregon);
	});

	it('gives a Campaign created in admin the catch-all', () => {
		expect(regionForCampaign(stored.id, stored.slug)).toBe(GENERIC_REGION);
	});
});

describe('resolveCampaign', () => {
	it('takes identity and place from the stored conversation', () => {
		expect(resolveCampaign(stored, oregon)).toEqual({
			id: stored.id,
			slug: 'ai-in-dundee',
			title: 'AI and the Future of Dundee',
			place: { slug: 'dundee', name: 'Dundee, Scotland' },
			poll: null,
			org: { slug: toPlaceSlug(oregon.hostName), name: oregon.hostName },
			// Not Oregon's partners: the region only supplies its defaults here, it
			// is not this Campaign.
			cohosts: [],
			source: 'conversation',
			isLegacyRegion: false
		});
	});

	it('falls back to the region when nothing resolved', () => {
		expect(resolveCampaign(null, oregon)).toEqual({
			id: oregon.conversationId,
			slug: oregon.slug,
			title: oregon.heroHeader,
			poll: null,
			org: { slug: toPlaceSlug(oregon.hostName), name: oregon.hostName },
			place: { slug: oregon.slug, name: oregon.stateName },
			cohosts: oregon.partners.map((p) => ({ name: p.name, url: p.url })),
			source: 'region',
			isLegacyRegion: true
		});
	});

	it('reads co-hosts from the metadata admin mirrored them into', () => {
		const campaign = resolveCampaign(
			{
				...stored,
				metadata: { cohosts: [{ name: 'Dundee Civic Trust', url: 'https://example.org' }] }
			},
			oregon
		);

		expect(campaign.cohosts).toEqual([{ name: 'Dundee Civic Trust', url: 'https://example.org' }]);
	});

	it('credits nobody rather than the catch-all when a Campaign has no co-hosts', () => {
		// The bug this replaced: a Campaign created in admin rendered "Hosted by
		// The Bloom Project" because the catch-all's partners were the only source.
		expect(resolveCampaign({ ...stored, metadata: {} }, GENERIC_REGION).cohosts).toEqual([]);
	});

	it('has no place when the conversation does not say and no region owns it', () => {
		const campaign = resolveCampaign({ ...stored, metadata: {} }, oregon);

		expect(campaign.place).toBeNull();
		expect(campaign.source).toBe('conversation');
	});

	it('never borrows the place of the region supplying its defaults', () => {
		// Otherwise every Campaign would list under whichever region's copy it
		// happened to fall back to.
		const campaign = resolveCampaign({ ...stored, metadata: {} }, oregon);

		expect(campaign.place?.slug).not.toBe(oregon.slug);
	});

	it('takes the place from the legacy region that owns the conversation', () => {
		const campaign = resolveCampaign(
			{ id: oregon.conversationId, slug: 'oregon', title: 'Oregon', metadata: {} },
			GENERIC_REGION
		);

		expect(campaign.place).toEqual({ slug: oregon.slug, name: oregon.stateName });
	});

	it('marks a Campaign a legacy region only when a region entry is it', () => {
		// The zip may route a participant to another Campaign only for these,
		// because only for these is a region the same thing as a Campaign.
		const utah = resolveCampaign(
			{ id: oregon.conversationId, slug: 'oregon', title: 'Oregon', metadata: {} },
			GENERIC_REGION
		);

		expect(utah.isLegacyRegion).toBe(true);
		expect(resolveCampaign(stored, oregon).isLegacyRegion).toBe(false);
	});

	it('keeps the backend id even when every copy field falls back', () => {
		const campaign = resolveCampaign({ id: stored.id, slug: null, title: '' }, oregon);

		expect(campaign.id).toBe(stored.id);
		expect(campaign.slug).toBe(oregon.slug);
		expect(campaign.title).toBe(oregon.heroHeader);
	});
});

describe('resolveCampaign poll identity', () => {
	it('takes the mirrored poll off the conversation', () => {
		const withPoll = {
			...stored,
			metadata: {
				place: { slug: 'dundee', name: 'Dundee, Scotland' },
				poll: { polisId: '2y2akzkmbb', question: 'How can Dundee…' }
			}
		};

		expect(resolveCampaign(withPoll, oregon).poll).toEqual({
			polisId: '2y2akzkmbb',
			question: 'How can Dundee…'
		});
	});

	it('is null when the Campaign has not been published, so the caller falls back', () => {
		// Null here is what sends `contribute` back to `regions.ts`, which is the
		// only other place a polis id exists: the Polis step is 401 anonymously.
		expect(resolveCampaign(stored, oregon).poll).toBeNull();
		expect(resolveCampaign(null, oregon).poll).toBeNull();
	});
});

describe('resolveCampaign org', () => {
	it('prefers the Host mirrored onto the conversation', () => {
		const withOrg = {
			...stored,
			metadata: { org: { slug: 'utah-common-ground', name: 'Utah Common Ground' } }
		};

		expect(resolveCampaign(withOrg, oregon).org).toEqual({
			slug: 'utah-common-ground',
			name: 'Utah Common Ground'
		});
	});

	it('falls back to the legacy region host, so old URLs keep their segment', () => {
		expect(resolveCampaign(stored, oregon).org?.name).toBe(oregon.hostName);
	});
});

describe('placeNameFor', () => {
	it("labels the chrome with the Campaign's Place", () => {
		expect(placeNameFor(resolveCampaign(stored, oregon), oregon)).toBe('Dundee, Scotland');
	});

	it('falls back to the region for a Campaign with no Place', () => {
		const unpublished = { ...stored, metadata: {} };

		expect(placeNameFor(resolveCampaign(unpublished, GENERIC_REGION), oregon)).toBe(
			oregon.stateName
		);
	});

	it('keeps a legacy region rendering its own name', () => {
		// Utah and Oregon predate Places, so theirs is derived from the region
		// entry rather than stored. The chrome must not change for them.
		expect(placeNameFor(resolveCampaign(null, oregon), oregon)).toBe(oregon.stateName);
	});

	it('never answers a hardcoded state for a Campaign it cannot place', () => {
		expect(placeNameFor(null, GENERIC_REGION)).toBe(GENERIC_REGION.stateName);
		expect(placeNameFor(undefined, GENERIC_REGION)).not.toBe('Utah');
	});
});

describe('pollFor', () => {
	const mirrored = {
		...stored,
		metadata: {
			poll: { polisId: '2y2akzkmbb', question: 'Key question?', workflowStepId: 'step-1' }
		}
	};

	it('takes the poll admin mirrored into the metadata', () => {
		const campaign = resolveCampaign(mirrored, GENERIC_REGION);

		expect(pollFor(campaign, GENERIC_REGION)).toEqual({
			polisId: '2y2akzkmbb',
			question: 'Key question?',
			workflowStepId: 'step-1'
		});
	});

	it('refuses to guess for a Campaign whose poll was never mirrored', () => {
		// The Polis step is 401 anonymously, so an unmirrored Campaign has nothing
		// naming its poll. This used to fall through to the participant's zip code
		// and then to PUBLIC_POLIS_ID, which could only open a different
		// Campaign's poll (#422, #421). `/contribute` answers 503 on this.
		const campaign = resolveCampaign({ ...stored, metadata: {} }, GENERIC_REGION);

		expect(pollFor(campaign, GENERIC_REGION)).toBeNull();
	});

	it('falls back to the region only where the region IS the Campaign', () => {
		const legacy = resolveCampaign(null, oregon);

		expect(pollFor(legacy, oregon)).toEqual({
			polisId: oregon.polisId,
			question: oregon.question,
			workflowStepId: oregon.polis_workflow_step_id
		});
	});

	it('prefers the mirror over the region for a legacy Campaign', () => {
		// Utah and Oregon have both. The stored value is the one admin maintains.
		const campaign = resolveCampaign(
			{ id: oregon.conversationId, title: 'Oregon', metadata: { poll: { polisId: 'stored-id' } } },
			oregon
		);

		expect(pollFor(campaign, oregon)?.polisId).toBe('stored-id');
	});
});
