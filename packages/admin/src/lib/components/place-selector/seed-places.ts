import { buildPlaces, createFixtureSource, type PlaceSeeds } from './fixture';
import { createFixtureGeometrySource } from './geometry-fixture';
import type { PlaceGeometrySource } from './geometry';
import type { Place, PlaceSource } from './places';

// Stand-in Areas until #509 imports real ones into comhairle. Delete this file when the
// API-backed PlaceSource lands; nothing outside stories should import it by then.
// County bboxes come from static/counties; city bboxes and geoids are approximate.
const SEEDS: PlaceSeeds = {
	states: [
		{ geoid: '41', name: 'Oregon', abbreviation: 'OR', bbox: [-124.55, 41.99, -116.46, 46.27] },
		{ geoid: '49', name: 'Utah', abbreviation: 'UT', bbox: [-114.05, 37.0, -109.04, 42.0] }
	],
	counties: [
		{ geoid: '41017', name: 'Deschutes County', state: '41', bbox: [-122.0, 43.61, -119.9, 44.39] },
		{ geoid: '41029', name: 'Jackson County', state: '41', bbox: [-123.23, 42.0, -122.28, 43.0] },
		{ geoid: '41039', name: 'Lane County', state: '41', bbox: [-124.16, 43.44, -121.77, 44.29] },
		{
			geoid: '41051',
			name: 'Multnomah County',
			state: '41',
			bbox: [-122.93, 45.43, -121.82, 45.73]
		},
		{
			geoid: '41067',
			name: 'Washington County',
			state: '41',
			bbox: [-123.48, 45.32, -122.74, 45.78]
		},
		{ geoid: '49011', name: 'Davis County', state: '49', bbox: [-112.49, 40.77, -111.74, 41.15] },
		{
			geoid: '49035',
			name: 'Salt Lake County',
			state: '49',
			bbox: [-112.26, 40.42, -111.55, 40.92]
		},
		{ geoid: '49049', name: 'Utah County', state: '49', bbox: [-112.21, 39.78, -110.86, 40.58] },
		{
			geoid: '49053',
			name: 'Washington County',
			state: '49',
			bbox: [-114.05, 37.0, -112.9, 37.62]
		},
		{ geoid: '49057', name: 'Weber County', state: '49', bbox: [-112.49, 41.08, -111.42, 41.43] }
	],
	cities: [
		{ geoid: '4105800', name: 'Bend', county: '41017', bbox: [-121.38, 43.99, -121.25, 44.11] },
		{ geoid: '4161200', name: 'Redmond', county: '41017', bbox: [-121.21, 44.23, -121.13, 44.3] },
		{ geoid: '4167950', name: 'Sisters', county: '41017', bbox: [-121.56, 44.28, -121.53, 44.3] },
		{ geoid: '4103050', name: 'Ashland', county: '41029', bbox: [-122.74, 42.16, -122.65, 42.22] },
		{
			geoid: '4112400',
			name: 'Central Point',
			county: '41029',
			bbox: [-122.95, 42.36, -122.88, 42.39]
		},
		{ geoid: '4147000', name: 'Medford', county: '41029', bbox: [-122.93, 42.29, -122.8, 42.38] },
		{ geoid: '4123850', name: 'Eugene', county: '41039', bbox: [-123.21, 43.99, -123.02, 44.13] },
		{ geoid: '4126050', name: 'Florence', county: '41039', bbox: [-124.13, 43.95, -124.08, 44.01] },
		{
			geoid: '4169600',
			name: 'Springfield',
			county: '41039',
			bbox: [-123.05, 44.02, -122.88, 44.08]
		},
		{ geoid: '4131250', name: 'Gresham', county: '41051', bbox: [-122.5, 45.47, -122.39, 45.55] },
		{ geoid: '4159000', name: 'Portland', county: '41051', bbox: [-122.84, 45.43, -122.47, 45.65] },
		{
			geoid: '4174850',
			name: 'Troutdale',
			county: '41051',
			bbox: [-122.43, 45.52, -122.36, 45.56]
		},
		{
			geoid: '4105350',
			name: 'Beaverton',
			county: '41067',
			bbox: [-122.87, 45.43, -122.76, 45.52]
		},
		{
			geoid: '4134100',
			name: 'Hillsboro',
			county: '41067',
			bbox: [-123.02, 45.49, -122.85, 45.57]
		},
		{ geoid: '4173650', name: 'Tigard', county: '41067', bbox: [-122.83, 45.4, -122.73, 45.46] },
		{
			geoid: '4907690',
			name: 'Bountiful',
			county: '49011',
			bbox: [-111.91, 40.85, -111.84, 40.91]
		},
		{ geoid: '4940360', name: 'Kaysville', county: '49011', bbox: [-111.97, 41.0, -111.91, 41.06] },
		{ geoid: '4943660', name: 'Layton', county: '49011', bbox: [-112.02, 41.04, -111.9, 41.12] },
		{
			geoid: '4967000',
			name: 'Salt Lake City',
			county: '49035',
			bbox: [-112.1, 40.7, -111.74, 40.85]
		},
		{ geoid: '4967440', name: 'Sandy', county: '49035', bbox: [-111.92, 40.53, -111.79, 40.62] },
		{
			geoid: '4983470',
			name: 'West Valley City',
			county: '49035',
			bbox: [-112.05, 40.64, -111.92, 40.72]
		},
		{ geoid: '4944320', name: 'Lehi', county: '49049', bbox: [-111.94, 40.35, -111.8, 40.45] },
		{ geoid: '4957300', name: 'Orem', county: '49049', bbox: [-111.75, 40.26, -111.66, 40.34] },
		{ geoid: '4962470', name: 'Provo', county: '49049', bbox: [-111.74, 40.18, -111.59, 40.31] },
		{ geoid: '4937430', name: 'Hurricane', county: '49053', bbox: [-113.35, 37.13, -113.25, 37.2] },
		{
			geoid: '4965330',
			name: 'St. George',
			county: '49053',
			bbox: [-113.66, 37.02, -113.49, 37.17]
		},
		{ geoid: '4955980', name: 'Ogden', county: '49057', bbox: [-112.03, 41.15, -111.92, 41.27] },
		{ geoid: '4964340', name: 'Roy', county: '49057', bbox: [-112.08, 41.15, -112.0, 41.19] }
	]
};

/** Oregon and Utah: five counties each, two or three cities per county. */
export const seedPlaces: Place[] = buildPlaces(SEEDS);

export function createSeedPlaceSource(): PlaceSource {
	return createFixtureSource(seedPlaces);
}

/** `countiesUrl` is where the app serves `static/counties`, `/counties` in admin. */
export function createSeedGeometrySource(countiesUrl = '/counties'): PlaceGeometrySource {
	return createFixtureGeometrySource(seedPlaces, { countiesUrl });
}
