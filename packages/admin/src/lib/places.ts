// A Place is a `custom` comhairle Region. Its name is the Region's own (translated)
// name; its slug and areas ride on `Region.metadata` until comhairle has a slug
// column (crownshy/comhairle#1826) and imported areas to link (#509). Same
// interim shape as a Campaign's areas, keyed by GEOID (ADR 0016).

import type { LocalizedRegionDto } from '@crownshy/api-client/api';
import { readAreas, type CampaignArea } from '@civicos/shared/data/areas';
import { toPlaceSlug } from '@civicos/shared/data/place';

export type PlaceRecord = {
	id: string;
	name: string;
	/** The `/places/<slug>` segment. Follows the name. */
	slug: string;
	areas: CampaignArea[];
};

/** What a save writes onto `Region.metadata`, as complete top-level keys. */
export type PlaceMetadata = { slug: string; areas: CampaignArea[] };

/**
 * Read a Place off a Region. A Region made before Places existed has no stored
 * slug, so it falls back to the one its name gives.
 */
export function placeFromRegion(
	region: Pick<LocalizedRegionDto, 'id' | 'name' | 'metadata'>
): PlaceRecord {
	const stored = (region.metadata as Record<string, unknown> | null | undefined)?.slug;
	const slug =
		typeof stored === 'string' && stored.trim() ? stored.trim() : toPlaceSlug(region.name);

	return { id: region.id, name: region.name, slug, areas: readAreas(region.metadata) };
}

export function placeMetadata(name: string, areas: CampaignArea[]): PlaceMetadata {
	return { slug: toPlaceSlug(name), areas };
}

/** The Place, other than `exceptId`, already using `slug`, if any. */
export function placeWithSlug(
	places: PlaceRecord[],
	slug: string,
	exceptId?: string
): PlaceRecord | null {
	return places.find((place) => place.slug === slug && place.id !== exceptId) ?? null;
}
