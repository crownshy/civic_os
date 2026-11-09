import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson';
import type { Bbox, Place, PlaceLevel } from './places';
import type { PlaceSelectorState } from './place-selector.svelte';

/** The boundary of a state or county. Cities are drawn as points, so they never need one. */
export type AreaGeometry = Polygon | MultiPolygon;

/**
 * Where the map gets boundaries. The API-backed source wraps `ListRegionAreas` with
 * `include_geometry`; stories and tests use a fixture. Ids with no geometry are left
 * out of the result rather than failing the whole call.
 */
export interface PlaceGeometrySource {
	geometries(ids: string[]): Promise<Map<string, AreaGeometry>>;
}

/** What the map draws, read off the selector state and the hovered row. */
export type PlaceMapView = {
	/** In pick order. */
	selected: Place[];
	/** The rows the picker is showing: the open level's children, or the search matches. */
	listed: Place[];
	hovered: Place | null;
	/** The level drilled into while editing, outlined dashed. Null at "All states" and while searching. */
	drilled: Place | null;
};

type SelectorSnapshot = Pick<
	PlaceSelectorState,
	'mode' | 'isSearching' | 'search' | 'currentId' | 'selected' | 'place' | 'rowsFor'
>;

/** Build the map's view of the selector. Nothing is listed or drilled outside edit mode. */
export function mapViewOf(state: SelectorSnapshot, hoveredId: string | null): PlaceMapView {
	const hovered = hoveredId ? (state.place(hoveredId) ?? null) : null;
	if (state.mode !== 'edit')
		return { selected: state.selected, listed: [], hovered, drilled: null };
	if (state.isSearching) {
		return { selected: state.selected, listed: state.search.places, hovered, drilled: null };
	}
	const drilled = state.currentId ? (state.place(state.currentId) ?? null) : null;
	return {
		selected: state.selected,
		listed: state.rowsFor(state.currentId) ?? [],
		hovered,
		drilled
	};
}

const isArea = (place: Place) => place.level !== 'city';

/** Ids of every state and county the view draws a boundary for, without repeats. */
export function areaIdsInView(view: PlaceMapView): string[] {
	const places = [...view.selected, ...view.listed, view.hovered, view.drilled];
	const ids = places.flatMap((place) => (place && isArea(place) ? [place.id] : []));
	return [...new Set(ids)];
}

/** Properties on every area feature, read by the layer paint and filters. */
export type AreaProperties = { id: string; level: PlaceLevel; name: string };

/** Properties on every city point. A city can be hovered and selected at once. */
export type CityProperties = { id: string; name: string; selected: boolean; hovered: boolean };

/** One FeatureCollection per map source. */
export type PlaceMapLayers = {
	/** Selected states and counties, states first so counties draw on top. */
	selected: FeatureCollection<AreaGeometry, AreaProperties>;
	/** Faint outlines of the listed states and counties, for context. */
	listed: FeatureCollection<AreaGeometry, AreaProperties>;
	hovered: FeatureCollection<AreaGeometry, AreaProperties>;
	drilled: FeatureCollection<AreaGeometry, AreaProperties>;
	cities: FeatureCollection<Point, CityProperties>;
};

const LEVEL_ORDER: Record<PlaceLevel, number> = { state: 0, county: 1, city: 2 };

function collection<G extends AreaGeometry | Point, P>(
	features: Feature<G, P>[]
): FeatureCollection<G, P> {
	return { type: 'FeatureCollection', features };
}

function areaCollection(
	places: (Place | null)[],
	geometries: ReadonlyMap<string, AreaGeometry>
): FeatureCollection<AreaGeometry, AreaProperties> {
	return collection(
		places.flatMap((place) => {
			const geometry = place && isArea(place) ? geometries.get(place.id) : undefined;
			if (!place || !geometry) return [];
			const properties = { id: place.id, level: place.level, name: place.name };
			return [{ type: 'Feature' as const, id: place.id, properties, geometry }];
		})
	);
}

/** The middle of a bounding box. Cities are Census place polygons, drawn as one dot. */
export function bboxCentre([west, south, east, north]: Bbox): [number, number] {
	return [(west + east) / 2, (south + north) / 2];
}

function cityCollection(view: PlaceMapView): FeatureCollection<Point, CityProperties> {
	const selectedIds = new Set(view.selected.map((place) => place.id));
	const cities = [...view.selected, ...view.listed, view.hovered].filter(
		(place): place is Place => place?.level === 'city'
	);
	const unique = new Map(cities.map((city) => [city.id, city]));
	return collection(
		[...unique.values()].map((city) => ({
			type: 'Feature' as const,
			id: city.id,
			properties: {
				id: city.id,
				name: city.name,
				selected: selectedIds.has(city.id),
				hovered: city.id === view.hovered?.id
			},
			geometry: { type: 'Point' as const, coordinates: bboxCentre(city.bbox) }
		}))
	);
}

/**
 * Turn a view into the map's FeatureCollections. Areas whose geometry has not loaded
 * yet are skipped, so the map fills in as boundaries arrive.
 */
export function buildMapLayers(
	view: PlaceMapView,
	geometries: ReadonlyMap<string, AreaGeometry>
): PlaceMapLayers {
	const selectedAreas = view.selected
		.filter(isArea)
		.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
	return {
		selected: areaCollection(selectedAreas, geometries),
		listed: areaCollection(view.listed, geometries),
		hovered: areaCollection([view.hovered], geometries),
		drilled: areaCollection([view.drilled], geometries),
		cities: cityCollection(view)
	};
}

/** A closed rectangle over a bbox, the fallback shape when no real boundary exists. */
export function bboxPolygon([west, south, east, north]: Bbox): Polygon {
	return {
		type: 'Polygon',
		coordinates: [
			[
				[west, south],
				[east, south],
				[east, north],
				[west, north],
				[west, south]
			]
		]
	};
}

/**
 * Remembers which ids have been asked for, so each boundary is requested once. Kept
 * outside Svelte's reactivity because the map's load effect both reads and writes it.
 */
export function createRequestLog() {
	const asked = new Set<string>();
	return {
		/** The ids not asked for yet, now marked as asked. */
		claim(ids: string[]): string[] {
			const fresh = ids.filter((id) => !asked.has(id));
			for (const id of fresh) asked.add(id);
			return fresh;
		},
		/** Forget ids whose request failed, so a later view asks again. */
		release(ids: string[]): void {
			for (const id of ids) asked.delete(id);
		}
	};
}
