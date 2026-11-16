// A Place is a comhairle Region. Its areas are the Region's area links, the same
// boundaries comhairle's own Regions screen edits. Its slug rides on
// `Region.metadata` until comhairle has a slug column (crownshy/comhairle#1826).

import type { LocalizedRegionDto, RegionAreaDto } from '@crownshy/api-client/api';
import { readAreas, type AreaLevel, type CampaignArea } from '@civicos/shared/data/areas';
import { toPlaceSlug } from '@civicos/shared/data/place';

export type PlaceRecord = {
	id: string;
	name: string;
	/** The `/p/<slug>` segment. */
	slug: string;
	areas: CampaignArea[];
};

/** What a save writes onto `Region.metadata`, as a complete top-level key. */
export type PlaceMetadata = { slug: string };

type RegionFields = Pick<LocalizedRegionDto, 'id' | 'name' | 'metadata' | 'official_id'>;

/**
 * The Place's slug: the one stored on metadata, else the Region's official id
 * (`utah` on the Regions comhairle created), else one made from its name.
 */
export function placeSlugOf(region: RegionFields): string {
	const stored = (region.metadata as Record<string, unknown> | null | undefined)?.slug;
	if (typeof stored === 'string' && stored.trim()) return stored.trim();

	const officialId = region.official_id?.trim();
	if (officialId) return toPlaceSlug(officialId) || officialId;

	return toPlaceSlug(region.name);
}

/**
 * A Place from its Region and the areas linked to it. A Place saved before
 * area links were used keeps its areas on metadata, so those stand in until the
 * next save moves them over.
 */
export function placeFromRegion(region: RegionFields, linkedAreas: CampaignArea[]): PlaceRecord {
	return {
		id: region.id,
		name: region.name,
		slug: placeSlugOf(region),
		areas: linkedAreas.length ? linkedAreas : readAreas(region.metadata)
	};
}

export function placeMetadata(name: string): PlaceMetadata {
	return { slug: toPlaceSlug(name) };
}

/** The Place, other than `exceptId`, already using `slug`, if any. */
export function placeWithSlug(
	places: PlaceRecord[],
	slug: string,
	exceptId?: string
): PlaceRecord | null {
	return places.find((place) => place.slug === slug && place.id !== exceptId) ?? null;
}

const GEOID_LENGTH: Record<AreaLevel, number> = { state: 2, county: 5, city: 7 };

function tagValues(tags: string[]): Map<string, string> {
	return new Map(
		tags.flatMap((tag) => {
			const at = tag.indexOf(':');
			return at > 0 ? [[tag.slice(0, at), tag.slice(at + 1)] as const] : [];
		})
	);
}

function levelOf(tags: string[], geoid: string | undefined): AreaLevel | null {
	if (tags.includes('state')) return 'state';
	if (tags.includes('county')) return 'county';
	if (tags.includes('place') || tags.includes('city')) return 'city';

	const byLength = Object.entries(GEOID_LENGTH).find(([, length]) => length === geoid?.length);
	return byLength ? (byLength[0] as AreaLevel) : null;
}

/**
 * Read a comhairle area as a Census state, county or city, from its tags. A
 * `geoid:` tag wins; otherwise the GEOID is built from the Census file's own
 * fields (`statefp`, then `countyfp` or `placefp`), which is how the state
 * import is tagged. Null for an area that is not one of the three.
 */
export function campaignAreaFromRegionArea(
	area: Pick<RegionAreaDto, 'name' | 'tags'>
): CampaignArea | null {
	const values = tagValues(area.tags);
	const statefp = values.get('statefp');
	const countyfp = values.get('countyfp');
	const placefp = values.get('placefp');

	let geoid = values.get('geoid');
	if (!geoid && statefp && countyfp) geoid = `${statefp}${countyfp}`;
	if (!geoid && statefp && placefp) geoid = `${statefp}${placefp}`;
	if (!geoid && statefp) geoid = statefp;

	const level = levelOf(area.tags, geoid);
	const name = area.name?.trim();
	if (!geoid || !/^\d+$/.test(geoid) || !level || !name) return null;
	if (geoid.length !== GEOID_LENGTH[level]) return null;

	return { geoid, level, name };
}

/** The key two areas share when they are the same Census area. */
export function areaKey(area: Pick<CampaignArea, 'geoid' | 'level'>): string {
	return `${area.level}:${area.geoid}`;
}
