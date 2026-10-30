export type PlaceLevel = 'state' | 'county' | 'city';

/** `[west, south, east, north]` in degrees, the order MapLibre's `fitBounds` takes. */
export type Bbox = [number, number, number, number];

/**
 * One pickable Area in the place selector: a state, county, or city. Built from a
 * comhairle `RegionArea` by whatever `PlaceSource` feeds the selector, so this module
 * never sees a DTO or its tags.
 */
export type Place = {
	id: string;
	level: PlaceLevel;
	name: string;
	/** Nearest first: a city lists its county, then its state. */
	ancestorIds: string[];
	/** The second line under the name: "State", "Oregon", "Jefferson County, OR". */
	context: string;
	/** Counties in a state, cities in a county. Cities have none. */
	childCount: number;
	bbox: Bbox;
};

/**
 * Where the selector gets its Areas. The API-backed source lives with the route that
 * owns the request; tests and stories use a fixture.
 */
export interface PlaceSource {
	roots(): Promise<Place[]>;
	children(id: string): Promise<Place[]>;
	/** Candidates for a query. The selector does the prefix match, ordering and cap. */
	search(query: string): Promise<Place[]>;
	byIds(ids: string[]): Promise<Place[]>;
}

export const SEARCH_LIMIT = 150;

const LEVEL_ORDER: Record<PlaceLevel, number> = { state: 0, county: 1, city: 2 };

/**
 * The nearest selected ancestor of a place, or null. Display only: it drives the
 * "Included with Jefferson County" line, and never selects or blocks the place itself.
 */
export function coveringAncestorId(place: Place, selectedIds: readonly string[]): string | null {
	return place.ancestorIds.find((id) => selectedIds.includes(id)) ?? null;
}

export function byLevelThenName(a: Place, b: Place): number {
	return (
		LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
		a.name.localeCompare(b.name) ||
		a.context.localeCompare(b.context)
	);
}

/**
 * Prefix-match places by name, then order states, counties, cities, and by name within
 * each level. `total` counts every match so the picker can say "Showing 150 of 412".
 */
export function rankSearchResults(
	candidates: readonly Place[],
	query: string,
	limit = SEARCH_LIMIT
): { places: Place[]; total: number } {
	const prefix = query.trim().toLowerCase();
	if (!prefix) return { places: [], total: 0 };
	const matches = candidates
		.filter((place) => place.name.toLowerCase().startsWith(prefix))
		.sort(byLevelThenName);
	return { places: matches.slice(0, limit), total: matches.length };
}

export function unionBbox(boxes: readonly Bbox[]): Bbox | null {
	if (boxes.length === 0) return null;
	return boxes.reduce((union, box) => [
		Math.min(union[0], box[0]),
		Math.min(union[1], box[1]),
		Math.max(union[2], box[2]),
		Math.max(union[3], box[3])
	]);
}
