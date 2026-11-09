// The Areas a Campaign runs in, as picked with the place selector. Interim storage on
// `metadata.areas`, keyed by Census GEOID so a selection survives comhairle importing
// the real areas (ADR 0016).

export type AreaLevel = 'state' | 'county' | 'city';

export interface CampaignArea {
	/** Census GEOID: `41` for a state, `41017` for a county, `4105800` for a city. */
	geoid: string;
	level: AreaLevel;
	/** Display name at the time it was picked, so a reader needs no lookup. */
	name: string;
}

export const AREAS_METADATA_KEY = 'areas';

const LEVELS: readonly AreaLevel[] = ['state', 'county', 'city'];

/** Read a Campaign's areas. Malformed entries are dropped, not thrown on. */
export function readAreas(metadata: unknown): CampaignArea[] {
	if (typeof metadata !== 'object' || metadata === null) return [];
	const value = (metadata as Record<string, unknown>)[AREAS_METADATA_KEY];
	if (!Array.isArray(value)) return [];

	return value.flatMap((entry): CampaignArea[] => {
		if (typeof entry !== 'object' || entry === null) return [];
		const { geoid, level, name } = entry as Record<string, unknown>;
		if (typeof geoid !== 'string' || !/^\d+$/.test(geoid)) return [];
		if (!LEVELS.includes(level as AreaLevel)) return [];
		if (typeof name !== 'string' || name.trim() === '') return [];
		return [{ geoid, level: level as AreaLevel, name: name.trim() }];
	});
}
