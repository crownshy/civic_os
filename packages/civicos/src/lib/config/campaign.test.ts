import { describe, expect, it } from 'vitest';
import { GENERIC_REGION, REGIONS } from '@civicos/shared/data/regions';
import { campaignCandidates, resolveCampaign } from './campaign';
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
		expect(campaignCandidates('oregon', oregon)).toEqual([oregon.conversationId, 'oregon']);
	});

	it('tries a stored slug directly', () => {
		expect(campaignCandidates('ai-in-dundee', GENERIC_REGION)).toEqual(['ai-in-dundee']);
	});

	it('never offers a mismatched region id', () => {
		// getRegionBySubdomain answers GENERIC_REGION for subdomains it does not
		// know, so its hardcoded id must not stand in for a slug nobody asked for.
		expect(campaignCandidates('ai-in-dundee', GENERIC_REGION)).not.toContain(
			GENERIC_REGION.conversationId
		);
	});

	it('drops duplicates', () => {
		const generic = campaignCandidates(GENERIC_REGION.slug, GENERIC_REGION);

		expect(generic).toEqual([GENERIC_REGION.conversationId, GENERIC_REGION.slug]);
		expect(new Set(generic).size).toBe(generic.length);
	});

	it('drops a blank slug', () => {
		expect(campaignCandidates('   ', GENERIC_REGION)).toEqual([]);
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
			source: 'conversation'
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
			source: 'region'
		});
	});

	it('has no place when the conversation does not say and no region owns it', () => {
		const campaign = resolveCampaign({ ...stored, metadata: {} }, oregon);

		expect(campaign.place).toBeNull();
		expect(campaign.source).toBe('conversation');
	});

	it('never borrows the place of the region the request arrived under', () => {
		// Otherwise every Campaign looks like it belongs wherever it was asked
		// for, and the route's Place check can never reject anything.
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

	it('keeps the backend id even when every copy field falls back', () => {
		const campaign = resolveCampaign({ id: stored.id, slug: null, title: '' }, oregon);

		expect(campaign.id).toBe(stored.id);
		expect(campaign.slug).toBe(oregon.slug);
		expect(campaign.title).toBe(oregon.heroHeader);
	});
});

describe('campaignCandidates with a Place', () => {
	it('tries the place-scoped conversation slug first', () => {
		// `/ai` under `utah.` is the Conversation `ai-utah`. The bare slug stays
		// behind it for Campaigns that predate the convention.
		expect(campaignCandidates('ai', GENERIC_REGION, 'utah')).toEqual(['ai-utah', 'ai']);
	});

	it('still leads with the legacy id when the slug names that region', () => {
		expect(campaignCandidates('oregon', oregon, 'oregon')).toEqual([
			oregon.conversationId,
			'oregon'
		]);
	});

	it('does not double up when the campaign and place slugs match', () => {
		expect(campaignCandidates('ai', GENERIC_REGION, 'ai')).toEqual(['ai']);
	});

	it('falls back to the bare slug when there is no subdomain', () => {
		expect(campaignCandidates('ai', GENERIC_REGION, '')).toEqual(['ai']);
		expect(campaignCandidates('ai', GENERIC_REGION)).toEqual(['ai']);
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
