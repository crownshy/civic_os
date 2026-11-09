import { describe, expect, it } from 'vitest';
import { readAreas } from '@civicos/shared/data/areas';
import { placeIdOf, toCampaignAreas } from './campaign-areas';
import { fixturePlaces } from './fixture';

const byId = (id: string) => fixturePlaces.find((place) => place.id === id)!;

describe('toCampaignAreas', () => {
	it('stores the GEOID, level and name of each place', () => {
		expect(toCampaignAreas([byId('state-41'), byId('county-41017'), byId('city-4105800')])).toEqual(
			[
				{ geoid: '41', level: 'state', name: 'Oregon' },
				{ geoid: '41017', level: 'county', name: 'Deschutes County' },
				{ geoid: '4105800', level: 'city', name: 'Bend' }
			]
		);
	});

	it('skips a place whose id carries no GEOID', () => {
		expect(toCampaignAreas([{ ...byId('state-41'), id: 'some-uuid' }])).toEqual([]);
	});

	it('round-trips through placeIdOf', () => {
		const ids = ['state-49', 'county-41031', 'city-4967000'];
		expect(toCampaignAreas(ids.map(byId)).map(placeIdOf)).toEqual(ids);
	});
});

describe('readAreas', () => {
	it('reads stored areas and drops malformed ones', () => {
		const metadata = {
			areas: [
				{ geoid: '41', level: 'state', name: 'Oregon' },
				{ geoid: '41', level: 'country', name: 'Oregon' },
				{ geoid: 'abc', level: 'state', name: 'Oregon' },
				{ geoid: '49', level: 'state', name: ' ' },
				null
			]
		};
		expect(readAreas(metadata)).toEqual([{ geoid: '41', level: 'state', name: 'Oregon' }]);
	});

	it('reads nothing when the key is missing or not a list', () => {
		expect(readAreas(null)).toEqual([]);
		expect(readAreas({})).toEqual([]);
		expect(readAreas({ areas: 'Oregon' })).toEqual([]);
	});
});
