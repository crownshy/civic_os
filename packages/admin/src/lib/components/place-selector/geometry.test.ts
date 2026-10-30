import { describe, expect, it } from 'vitest';
import { fixturePlaces } from './fixture';
import { createFixtureGeometrySource } from './geometry-fixture';
import {
	areaIdsInView,
	bboxCentre,
	bboxPolygon,
	buildMapLayers,
	createRequestLog,
	mapViewOf,
	type AreaGeometry,
	type PlaceMapView
} from './geometry';
import type { Place } from './places';

const byId = new Map(fixturePlaces.map((place) => [place.id, place]));
const place = (id: string) => byId.get(id)!;
const places = (...ids: string[]) => ids.map(place);

function view(overrides: Partial<PlaceMapView> = {}): PlaceMapView {
	return { selected: [], listed: [], hovered: null, drilled: null, ...overrides };
}

function allGeometries(): Map<string, AreaGeometry> {
	return new Map(fixturePlaces.map((area) => [area.id, bboxPolygon(area.bbox)]));
}

const featureIds = (collection: { features: { id?: string | number }[] }) =>
	collection.features.map((feature) => feature.id);

type Snapshot = Parameters<typeof mapViewOf>[0];

function snapshot(overrides: Partial<Snapshot>): Snapshot {
	return {
		mode: 'view',
		isSearching: false,
		search: { places: [], total: 0 },
		currentId: null,
		selected: [],
		place: (id: string) => byId.get(id),
		rowsFor: (id: string | null) =>
			fixturePlaces.filter((candidate) =>
				id ? candidate.ancestorIds[0] === id : candidate.ancestorIds.length === 0
			),
		...overrides
	};
}

describe('mapViewOf', () => {
	it('shows only the selection while viewing', () => {
		const selected = places('state-49');
		expect(mapViewOf(snapshot({ selected }), null)).toEqual(view({ selected }));
	});

	it('lists the open level and outlines it while editing', () => {
		const result = mapViewOf(snapshot({ mode: 'edit', currentId: 'county-41031' }), null);
		expect(result.drilled?.id).toBe('county-41031');
		expect(result.listed.map((row) => row.name)).toEqual(['Culver', 'Madras', 'Metolius']);
	});

	it('lists search matches and drops the drilled outline while searching', () => {
		const matches = places('county-41017', 'city-4105800');
		const result = mapViewOf(
			snapshot({
				mode: 'edit',
				isSearching: true,
				currentId: 'state-41',
				search: { places: matches, total: 2 }
			}),
			'city-4105800'
		);
		expect(result.listed).toEqual(matches);
		expect(result.drilled).toBeNull();
		expect(result.hovered?.name).toBe('Bend');
	});
});

describe('areaIdsInView', () => {
	it('asks for states and counties once each, never cities', () => {
		const ids = areaIdsInView(
			view({
				selected: places('state-41', 'city-4105800', 'county-41031'),
				listed: places('county-41031', 'county-41017'),
				hovered: place('county-41017'),
				drilled: place('state-41')
			})
		);
		expect(ids).toEqual(['state-41', 'county-41031', 'county-41017']);
	});
});

describe('buildMapLayers', () => {
	it('draws selected states under selected counties', () => {
		const layers = buildMapLayers(
			view({ selected: places('county-41031', 'state-49', 'county-41017') }),
			allGeometries()
		);
		expect(featureIds(layers.selected)).toEqual(['state-49', 'county-41031', 'county-41017']);
		expect(layers.selected.features[0].properties.level).toBe('state');
	});

	it('skips areas whose geometry has not loaded yet', () => {
		const geometries = new Map([['state-49', bboxPolygon(place('state-49').bbox)]]);
		const layers = buildMapLayers(
			view({ selected: places('state-49', 'county-41031') }),
			geometries
		);
		expect(featureIds(layers.selected)).toEqual(['state-49']);
	});

	it('puts the hovered and drilled areas in their own layers', () => {
		const layers = buildMapLayers(
			view({ hovered: place('county-41017'), drilled: place('state-41') }),
			allGeometries()
		);
		expect(featureIds(layers.hovered)).toEqual(['county-41017']);
		expect(featureIds(layers.drilled)).toEqual(['state-41']);
	});

	it('draws cities as dots at their bbox centre, flagged selected or hovered', () => {
		const layers = buildMapLayers(
			view({
				selected: places('city-4145250'),
				listed: places('city-4116750', 'city-4145250', 'city-4148000'),
				hovered: place('city-4148000')
			}),
			allGeometries()
		);
		const cities = layers.cities.features.map((feature) => feature.properties);
		expect(cities).toEqual([
			{ id: 'city-4145250', name: 'Madras', selected: true, hovered: false },
			{ id: 'city-4116750', name: 'Culver', selected: false, hovered: false },
			{ id: 'city-4148000', name: 'Metolius', selected: false, hovered: true }
		]);
		expect(layers.cities.features[0].geometry.coordinates).toEqual(
			bboxCentre(place('city-4145250').bbox)
		);
	});

	it('leaves cities out of the area layers', () => {
		const layers = buildMapLayers(
			view({ selected: places('city-4105800'), listed: places('city-4105800') }),
			allGeometries()
		);
		expect(layers.selected.features).toEqual([]);
		expect(layers.listed.features).toEqual([]);
	});
});

describe('createRequestLog', () => {
	it('hands out each id once until it is released', () => {
		const log = createRequestLog();
		expect(log.claim(['state-49', 'state-41'])).toEqual(['state-49', 'state-41']);
		expect(log.claim(['state-41', 'county-41031'])).toEqual(['county-41031']);
		log.release(['state-41']);
		expect(log.claim(['state-41'])).toEqual(['state-41']);
	});
});

describe('createFixtureGeometrySource', () => {
	it('returns a rectangle per state or county and nothing for cities', async () => {
		const source = createFixtureGeometrySource();
		const geometries = await source.geometries(['state-49', 'county-41031', 'city-4105800']);
		expect([...geometries.keys()]).toEqual(['state-49', 'county-41031']);
		expect(geometries.get('state-49')).toEqual(bboxPolygon(place('state-49').bbox));
	});

	it('ignores ids it does not know', async () => {
		const source = createFixtureGeometrySource([] as Place[]);
		expect((await source.geometries(['state-49'])).size).toBe(0);
	});
});
