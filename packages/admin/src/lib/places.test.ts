import { describe, expect, it } from 'vitest';
import {
	campaignAreaFromRegionArea,
	placeFromRegion,
	placeMetadata,
	placeSlugOf,
	placeWithSlug
} from './places';

const deschutes = { geoid: '41017', level: 'county' as const, name: 'Deschutes County' };
const oregon = { geoid: '41', level: 'state' as const, name: 'Oregon' };

describe('placeSlugOf', () => {
	it('prefers the slug stored on metadata', () => {
		expect(
			placeSlugOf({
				id: 'r1',
				name: 'Central Oregon',
				official_id: 'co',
				metadata: { slug: 'central-oregon' }
			})
		).toBe('central-oregon');
	});

	it('falls back to the official id comhairle Regions carry', () => {
		expect(placeSlugOf({ id: 'r2', name: 'State of Utah', official_id: 'utah' })).toBe('utah');
	});

	it('derives one from the name when there is nothing else', () => {
		expect(placeSlugOf({ id: 'r3', name: 'Utah', metadata: { slug: '  ' } })).toBe('utah');
	});
});

describe('placeFromRegion', () => {
	it('uses the linked areas', () => {
		const place = placeFromRegion({ id: 'r1', name: 'Oregon', official_id: 'oregon' }, [oregon]);

		expect(place).toEqual({ id: 'r1', name: 'Oregon', slug: 'oregon', areas: [oregon] });
	});

	it('falls back to areas an earlier save stored on metadata', () => {
		const region = { id: 'r1', name: 'Central Oregon', metadata: { areas: [deschutes] } };

		expect(placeFromRegion(region, []).areas).toEqual([deschutes]);
	});

	it('ignores metadata areas once there are links', () => {
		const region = { id: 'r1', name: 'Oregon', metadata: { areas: [deschutes] } };

		expect(placeFromRegion(region, [oregon]).areas).toEqual([oregon]);
	});
});

describe('placeMetadata', () => {
	it('derives the slug from the name', () => {
		expect(placeMetadata('Central Oregon')).toEqual({ slug: 'central-oregon' });
	});
});

describe('placeWithSlug', () => {
	const places = [
		{ id: 'r1', name: 'Utah', slug: 'utah', areas: [] },
		{ id: 'r2', name: 'Oregon', slug: 'oregon', areas: [] }
	];

	it('finds another Place on the same slug', () => {
		expect(placeWithSlug(places, 'utah')?.id).toBe('r1');
	});

	it('does not count the Place being edited', () => {
		expect(placeWithSlug(places, 'utah', 'r1')).toBeNull();
	});
});

describe('campaignAreaFromRegionArea', () => {
	it('reads a state from the Census state import', () => {
		const area = {
			name: 'Utah',
			tags: ['dataset:cb_2018_us_state_500k', 'state', 'statefp:49', 'stusps:UT', 'lsad:00']
		};

		expect(campaignAreaFromRegionArea(area)).toEqual({ geoid: '49', level: 'state', name: 'Utah' });
	});

	it('builds a county GEOID from statefp and countyfp', () => {
		const area = { name: 'Deschutes County', tags: ['county', 'statefp:41', 'countyfp:017'] };

		expect(campaignAreaFromRegionArea(area)).toEqual(deschutes);
	});

	it('takes a geoid tag over the Census fields', () => {
		const area = { name: 'Bend', tags: ['place', 'statefp:41', 'geoid:4105800'] };

		expect(campaignAreaFromRegionArea(area)).toEqual({
			geoid: '4105800',
			level: 'city',
			name: 'Bend'
		});
	});

	it('works out the level from the GEOID length when no level tag is given', () => {
		expect(campaignAreaFromRegionArea({ name: 'Deschutes County', tags: ['geoid:41017'] })).toEqual(
			deschutes
		);
	});

	it('is null for an area that is not a Census state, county or city', () => {
		expect(campaignAreaFromRegionArea({ name: '970 zip prefix', tags: ['zip'] })).toBeNull();
		expect(campaignAreaFromRegionArea({ name: null, tags: ['state', 'statefp:49'] })).toBeNull();
		expect(campaignAreaFromRegionArea({ name: 'Odd', tags: ['county', 'statefp:41'] })).toBeNull();
	});
});
