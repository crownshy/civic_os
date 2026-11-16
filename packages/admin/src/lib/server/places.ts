import type { Api } from '@civicos/shared/api';
import type { CampaignArea } from '@civicos/shared/data/areas';
import { placeFromRegion, placeMetadata, type PlaceRecord } from '$lib/places';

/** Region names are translated text, stored in this locale. */
const PLACE_LOCALE = 'en';

export async function listPlaces(api: Api): Promise<PlaceRecord[]> {
	const regions = await api.ListRegions({ queries: { limit: 200 } });
	return regions.records.map(placeFromRegion).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createPlace(
	api: Api,
	name: string,
	areas: CampaignArea[]
): Promise<PlaceRecord> {
	const region = await api.CreateRegion({ name, description: '', region_type: 'custom' });

	// A Region with no slug or areas is no Place at all, so undo it rather than
	// leave one behind that the list would show.
	try {
		await api.PatchRegionMetadata(placeMetadata(name, areas), {
			params: { region_id: region.id }
		});
	} catch (e) {
		await api.DeleteRegion(undefined, { params: { region_id: region.id } }).catch(() => {});
		throw e;
	}

	return { id: region.id, ...placeMetadata(name, areas), name };
}

/**
 * Save a Place's name and areas. The name is not a Region column but a
 * translation, and `UpdateRegion` cannot touch it, so it is written against the
 * text content id the metadata patch hands back.
 */
export async function updatePlace(
	api: Api,
	place: PlaceRecord,
	name: string,
	areas: CampaignArea[]
): Promise<void> {
	const region = await api.PatchRegionMetadata(placeMetadata(name, areas), {
		params: { region_id: place.id }
	});

	if (name === place.name) return;
	await api.CreateOrUpdateTextTranslation(
		{ content: name },
		{ params: { text_content_id: region.name, locale: PLACE_LOCALE } }
	);
}
