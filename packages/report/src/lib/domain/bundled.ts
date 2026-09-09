/**
 * The Oregon COCAP dataset, wired up.
 *
 * This is the one module that knows the report's data is bundled JSON. When
 * the data starts coming from Comhairle, this file is what gets replaced,
 * everything else works off `./types` and the pure functions in `./data`.
 *
 * The `as unknown as` casts are the boundary between JSON's inferred types
 * (`origin: string`, `place: null`) and the domain's. They are asserted, not
 * validated: the data ships with the app and `refresh-poll.js` upstream is
 * what guarantees the shape.
 */

import bloomData from '../data/bloom-data.json';
import insightsData from '../data/bloom-insights.json';
import groupInfoData from '../data/group-info.json';
import groupStatementsData from '../data/group-statements.json';
import consensusData from '../data/consensus-statements.json';
import themeDescriptionsData from '../data/theme-descriptions.json';
import demographicsData from '../data/demographics.json';
import participantLocationsData from '../data/participant-locations.json';
import oregonCountiesData from '../data/oregon-counties.json';

import { buildThemeView, indexById } from './data';
import type { Group, GroupInfo, Insight, ReportRecord, Theme, ThemeView } from './types';

/** Editorial JSON files carry a `_readme` describing where their numbers came from. */
const withoutReadme = <T>(source: Record<string, unknown>): Record<string, T> =>
	Object.fromEntries(Object.entries(source).filter(([key]) => !key.startsWith('_'))) as Record<
		string,
		T
	>;

export const THEMES = bloomData.themes as readonly Theme[];
export const RECORDS = bloomData.records as unknown as readonly ReportRecord[];
export const GROUPS = bloomData.groups as readonly Group[];

export const INSIGHTS = withoutReadme<Insight[]>(insightsData);
export const GROUP_INFO = withoutReadme<GroupInfo>(groupInfoData);
/** Per group, the statements Polis says most define it, in rank order. */
export const GROUP_STATEMENTS =
	withoutReadme<{ id: string; direction: string }[]>(groupStatementsData);

export const THEME_DESCRIPTIONS = themeDescriptionsData.themes as Record<
	string,
	{ description: string; note?: string }
>;

export const RECORD_BY_ID = indexById(RECORDS);
export const THEME_BY_KEY = new Map(THEMES.map((theme) => [theme.key, theme]));

/**
 * Borrowed by the demographics modal's row swatches; it has no per-category
 * colour of its own, so it cycles through the theme grid's palette.
 */
export const THEME_COLORS = THEMES.map((theme) => theme.color);

/** Each theme's ranked statements, computed once. */
export const THEME_VIEWS: Readonly<Record<string, ThemeView>> = Object.freeze(
	Object.fromEntries(
		THEMES.map((theme) => [theme.key, buildThemeView(RECORDS, theme, INSIGHTS[theme.key] ?? [])])
	)
);

/** The hand-picked common ground shown on the Consensus page, in order. */
export const CONSENSUS_RECORDS: readonly ReportRecord[] = Object.freeze(
	consensusData.ids.map((id) => RECORD_BY_ID.get(id)).filter((r): r is ReportRecord => Boolean(r))
);

/** The Demographics detail modal, one category per tab. */
export const DEMOGRAPHICS = demographicsData;

/**
 * Cities with participant counts and real lat/lng for the Demographics map,
 * plus an `other` bucket for every zip not broken out. Note d3-geo takes
 * points as [lng, lat], the reverse of these fields' reading order.
 */
export const PARTICIPANT_LOCATIONS = participantLocationsData;

/**
 * GeoJSON for all 36 Oregon counties, from the U.S. Census Bureau. All 36 are
 * kept, not just the three Central Oregon ones, so the map's zoomed-out bound
 * is the real state outline.
 */
export const OREGON_COUNTIES = oregonCountiesData;
