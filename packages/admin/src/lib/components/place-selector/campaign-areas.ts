import type { AreaLevel, CampaignArea } from '@civicos/shared/data/areas';
import type { Place, PlaceSource } from './places';

// Selector ids are `<level>-<geoid>`, the same shape the data sources build.
const PLACE_ID = /^(state|county|city)-(\d+)$/;

export function placeIdOf(area: CampaignArea): string {
	return `${area.level}-${area.geoid}`;
}

/** What gets stored for a selection. Places whose id is not `<level>-<geoid>` are skipped. */
export function toCampaignAreas(places: readonly Place[]): CampaignArea[] {
	return places.flatMap((place) => {
		const match = PLACE_ID.exec(place.id);
		if (!match) return [];
		return [{ geoid: match[2], level: match[1] as AreaLevel, name: place.name }];
	});
}

/** The areas for a selection, in the order the ids were picked. */
export async function areasForIds(source: PlaceSource, ids: string[]): Promise<CampaignArea[]> {
	const byId = new Map((await source.byIds(ids)).map((place) => [place.id, place]));
	return toCampaignAreas(ids.flatMap((id) => byId.get(id) ?? []));
}
