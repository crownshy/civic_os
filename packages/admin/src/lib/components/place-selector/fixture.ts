import type { Bbox, Place, PlaceSource } from './places';

type StateSeed = { geoid: string; name: string; abbreviation: string; bbox: Bbox };
type CountySeed = { geoid: string; name: string; state: string; bbox: Bbox };
type CitySeed = { geoid: string; name: string; county: string; bbox: Bbox };

const STATES: StateSeed[] = [
	{ geoid: '06', name: 'California', abbreviation: 'CA', bbox: [-124.48, 32.53, -114.13, 42.01] },
	{ geoid: '41', name: 'Oregon', abbreviation: 'OR', bbox: [-124.57, 41.99, -116.46, 46.29] },
	{ geoid: '49', name: 'Utah', abbreviation: 'UT', bbox: [-114.05, 36.99, -109.04, 42.0] }
];

const COUNTIES: CountySeed[] = [
	{ geoid: '06001', name: 'Alameda County', state: '06', bbox: [-122.37, 37.45, -121.47, 37.91] },
	{
		geoid: '06075',
		name: 'San Francisco County',
		state: '06',
		bbox: [-122.52, 37.7, -122.36, 37.83]
	},
	{ geoid: '41013', name: 'Crook County', state: '41', bbox: [-121.11, 43.62, -119.9, 44.76] },
	{ geoid: '41017', name: 'Deschutes County', state: '41', bbox: [-122.0, 43.37, -120.75, 44.39] },
	{ geoid: '41031', name: 'Jefferson County', state: '41', bbox: [-121.85, 44.39, -120.75, 44.89] },
	{ geoid: '49035', name: 'Salt Lake County', state: '49', bbox: [-112.26, 40.41, -111.55, 40.92] },
	{ geoid: '49043', name: 'Summit County', state: '49', bbox: [-111.6, 40.58, -110.0, 41.27] }
];

const CITIES: CitySeed[] = [
	{ geoid: '0600562', name: 'Alameda', county: '06001', bbox: [-122.34, 37.73, -122.22, 37.8] },
	{ geoid: '0653000', name: 'Oakland', county: '06001', bbox: [-122.35, 37.7, -122.11, 37.89] },
	{
		geoid: '0667000',
		name: 'San Francisco',
		county: '06075',
		bbox: [-122.51, 37.71, -122.36, 37.81]
	},
	{ geoid: '4160200', name: 'Prineville', county: '41013', bbox: [-120.88, 44.28, -120.8, 44.32] },
	{ geoid: '4105800', name: 'Bend', county: '41017', bbox: [-121.38, 43.99, -121.25, 44.11] },
	{ geoid: '4161200', name: 'Redmond', county: '41017', bbox: [-121.21, 44.23, -121.13, 44.3] },
	{ geoid: '4167950', name: 'Sisters', county: '41017', bbox: [-121.56, 44.28, -121.53, 44.3] },
	{ geoid: '4116750', name: 'Culver', county: '41031', bbox: [-121.22, 44.52, -121.2, 44.53] },
	{ geoid: '4145250', name: 'Madras', county: '41031', bbox: [-121.15, 44.61, -121.11, 44.66] },
	{ geoid: '4148000', name: 'Metolius', county: '41031', bbox: [-121.18, 44.58, -121.17, 44.59] },
	{
		geoid: '4967000',
		name: 'Salt Lake City',
		county: '49035',
		bbox: [-112.1, 40.7, -111.74, 40.85]
	},
	{ geoid: '4967440', name: 'Sandy', county: '49035', bbox: [-111.92, 40.53, -111.79, 40.62] },
	{ geoid: '4958070', name: 'Park City', county: '49043', bbox: [-111.55, 40.62, -111.46, 40.69] }
];

function buildFixturePlaces(): Place[] {
	const stateByGeoid = new Map(STATES.map((state) => [state.geoid, state]));
	const countyByGeoid = new Map(COUNTIES.map((county) => [county.geoid, county]));
	const countOf = <T>(items: T[], matches: (item: T) => boolean) => items.filter(matches).length;

	const states = STATES.map<Place>((state) => ({
		id: `state-${state.geoid}`,
		level: 'state',
		name: state.name,
		ancestorIds: [],
		context: 'State',
		childCount: countOf(COUNTIES, (county) => county.state === state.geoid),
		bbox: state.bbox
	}));
	const counties = COUNTIES.map<Place>((county) => ({
		id: `county-${county.geoid}`,
		level: 'county',
		name: county.name,
		ancestorIds: [`state-${county.state}`],
		context: stateByGeoid.get(county.state)!.name,
		childCount: countOf(CITIES, (city) => city.county === county.geoid),
		bbox: county.bbox
	}));
	const cities = CITIES.map<Place>((city) => {
		const county = countyByGeoid.get(city.county)!;
		const state = stateByGeoid.get(county.state)!;
		return {
			id: `city-${city.geoid}`,
			level: 'city',
			name: city.name,
			ancestorIds: [`county-${county.geoid}`, `state-${state.geoid}`],
			context: `${county.name}, ${state.abbreviation}`,
			childCount: 0,
			bbox: city.bbox
		};
	});
	return [...states, ...counties, ...cities];
}

/** Three states, a handful of counties and cities, with roughly real bounding boxes. */
export const fixturePlaces: Place[] = buildFixturePlaces();

/**
 * An in-memory `PlaceSource` for tests and stories. `delayMs` makes each call resolve
 * later, to exercise loading states and out-of-order search responses.
 */
export function createFixtureSource(
	places: Place[] = fixturePlaces,
	{ delayMs = 0 }: { delayMs?: number } = {}
): PlaceSource {
	const settle = <T>(value: T) =>
		new Promise<T>((resolve) => setTimeout(() => resolve(value), delayMs));
	return {
		roots: () => settle(places.filter((place) => place.ancestorIds.length === 0)),
		children: (id) => settle(places.filter((place) => place.ancestorIds[0] === id)),
		search: (query) => {
			const needle = query.toLowerCase();
			return settle(places.filter((place) => place.name.toLowerCase().includes(needle)));
		},
		byIds: (ids) => settle(places.filter((place) => ids.includes(place.id)))
	};
}
