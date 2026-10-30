import type { FeatureCollection } from 'geojson';
import { fixturePlaces } from './fixture';
import { bboxPolygon, type AreaGeometry, type PlaceGeometrySource } from './geometry';
import type { Place } from './places';

const STATE_ABBREVIATIONS: Record<string, string> = { '06': 'CA', '41': 'OR', '49': 'UT' };

type CountyFile = FeatureCollection<AreaGeometry, { GEO_ID?: string }>;

/** Census county GEO_IDs end in the five-digit county geoid our fixture ids carry. */
function countyShapes(file: CountyFile): Map<string, AreaGeometry> {
	return new Map(
		file.features.flatMap((feature) => {
			const geoid = feature.properties.GEO_ID?.slice(-5);
			return geoid ? [[`county-${geoid}`, feature.geometry] as const] : [];
		})
	);
}

/**
 * A `PlaceGeometrySource` for tests and stories. Every area is its bbox as a rectangle,
 * unless `countiesUrl` is given: then counties use the real shapes in the app's static
 * `counties_XX.geojson` files, so a story looks like a map rather than a set of boxes.
 */
export function createFixtureGeometrySource(
	places: Place[] = fixturePlaces,
	{ countiesUrl }: { countiesUrl?: string } = {}
): PlaceGeometrySource {
	const byId = new Map(places.map((place) => [place.id, place]));
	const countyFiles = new Map<string, Promise<Map<string, AreaGeometry>>>();

	function loadCountyFile(stateGeoid: string): Promise<Map<string, AreaGeometry>> {
		const abbreviation = STATE_ABBREVIATIONS[stateGeoid];
		if (!countiesUrl || !abbreviation) return Promise.resolve(new Map());
		const cached = countyFiles.get(abbreviation);
		if (cached) return cached;
		const loading = fetch(`${countiesUrl}/counties_${abbreviation}.geojson`)
			.then((response) => (response.ok ? response.json() : { features: [] }))
			.then(countyShapes);
		countyFiles.set(abbreviation, loading);
		return loading;
	}

	async function geometryFor(place: Place): Promise<AreaGeometry> {
		if (place.level !== 'county') return bboxPolygon(place.bbox);
		const shapes = await loadCountyFile(place.id.slice('county-'.length, 'county-'.length + 2));
		return shapes.get(place.id) ?? bboxPolygon(place.bbox);
	}

	return {
		async geometries(ids) {
			const areas = ids.flatMap((id) => {
				const place = byId.get(id);
				return place && place.level !== 'city' ? [place] : [];
			});
			const entries = await Promise.all(
				areas.map(async (place) => [place.id, await geometryFor(place)] as const)
			);
			return new Map(entries);
		}
	};
}
