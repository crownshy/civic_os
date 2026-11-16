import { error } from '@sveltejs/kit';
import type { LocalizedRegionDto } from '@crownshy/api-client/api';
import type { Api } from '@civicos/shared/api';
import type { CampaignArea } from '@civicos/shared/data/areas';
import {
	areaKey,
	campaignAreaFromRegionArea,
	placeFromRegion,
	placeMetadata,
	type PlaceRecord
} from '$lib/places';

/** Region names are translated text, stored in this locale. */
const PLACE_LOCALE = 'en';

/** Comfortably more than the counties and cities in any one state. */
const AREAS_PER_STATE = 2000;

async function linkedAreas(api: Api, regionId: string): Promise<CampaignArea[]> {
	const { area_ids } = await api.GetRegionAreaLinks({ params: { region_id: regionId } });
	if (area_ids.length === 0) return [];

	const { records } = await api.ListRegionAreas({
		queries: { ids: area_ids.join(','), limit: area_ids.length }
	});
	return records.flatMap((area) => campaignAreaFromRegionArea(area) ?? []);
}

async function toPlace(api: Api, region: LocalizedRegionDto): Promise<PlaceRecord> {
	return placeFromRegion(region, await linkedAreas(api, region.id));
}

export async function listPlaces(api: Api): Promise<PlaceRecord[]> {
	const regions = await api.ListRegions({ queries: { limit: 200 } });
	const places = await Promise.all(regions.records.map((region) => toPlace(api, region)));
	return places.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlace(api: Api, id: string): Promise<PlaceRecord> {
	let region: LocalizedRegionDto;
	try {
		region = await api.GetRegion({ params: { region_id: id } });
	} catch (e) {
		console.warn('GetRegion failed', e);
		error(404, 'Place not found');
	}
	return toPlace(api, region);
}

export type ResolvedAreas = { areaIds: string[]; missing: CampaignArea[] };

/**
 * The comhairle area id behind each picked area. The picker works in Census
 * GEOIDs, so each state's areas are listed once and matched on their tags.
 * `missing` is every pick comhairle has no boundary for yet.
 */
export async function resolveAreaIds(api: Api, areas: CampaignArea[]): Promise<ResolvedAreas> {
	const states = [...new Set(areas.map((area) => area.geoid.slice(0, 2)))];
	const listed = await Promise.all(
		states.map((statefp) =>
			api.ListRegionAreas({ queries: { tag: `statefp:${statefp}`, limit: AREAS_PER_STATE } })
		)
	);

	const idByKey = new Map<string, string>();
	for (const area of listed.flatMap(({ records }) => records)) {
		const parsed = campaignAreaFromRegionArea(area);
		if (parsed) idByKey.set(areaKey(parsed), area.id);
	}

	const areaIds: string[] = [];
	const missing: CampaignArea[] = [];
	for (const area of areas) {
		const id = idByKey.get(areaKey(area));
		if (id) areaIds.push(id);
		else missing.push(area);
	}
	return { areaIds, missing };
}

export async function createPlace(api: Api, name: string, areaIds: string[]): Promise<void> {
	const region = await api.CreateRegion({ name, description: '', region_type: 'custom' });

	// A Region with no slug or areas is no Place at all, so undo it rather than
	// leave one behind that the list would show.
	try {
		await api.PatchRegionMetadata(placeMetadata(name), { params: { region_id: region.id } });
		await api.SetRegionAreaLinks({ area_ids: areaIds }, { params: { region_id: region.id } });
	} catch (e) {
		await api.DeleteRegion(undefined, { params: { region_id: region.id } }).catch(() => {});
		throw e;
	}
}

/**
 * Save a Place's name and areas. The name is not a Region column but a
 * translation, and `UpdateRegion` cannot touch it, so it is written against the
 * text content id the metadata patch hands back. The patch also drops any
 * areas an earlier version stored on metadata, now that they are links.
 */
export async function updatePlace(
	api: Api,
	place: PlaceRecord,
	name: string,
	areaIds: string[]
): Promise<void> {
	await api.SetRegionAreaLinks({ area_ids: areaIds }, { params: { region_id: place.id } });
	const region = await api.PatchRegionMetadata(
		{ ...placeMetadata(name), areas: null },
		{ params: { region_id: place.id } }
	);

	if (name === place.name) return;
	await api.CreateOrUpdateTextTranslation(
		{ content: name },
		{ params: { text_content_id: region.name, locale: PLACE_LOCALE } }
	);
}

/** The error a save shows when a picked area has no boundary in comhairle yet. */
export function missingAreasMessage(missing: CampaignArea[]): string {
	const names = missing.map((area) => area.name).join(', ');
	return `comhairle has no boundary for ${names} yet. Pick the state instead, or import the boundary first.`;
}
