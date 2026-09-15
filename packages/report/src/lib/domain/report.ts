/**
 * One report, assembled from the files it ships with.
 *
 * This is the one module that knows a report's data arrives as bundled JSON.
 * When it starts coming from Comhairle, this file is what gets replaced;
 * everything else works off `Report` and the pure functions in `./data`.
 *
 * The casts are the boundary between JSON's inferred types (`origin: string`,
 * `place: null`) and the domain's. They are asserted, not validated: the data
 * ships with the app, and upstream's merge step guarantees its shape.
 */

import { buildThemeView, indexById } from './data';
import type {
	Demographics,
	Group,
	GroupInfo,
	Insight,
	ReportConfig,
	ReportRecord,
	Theme,
	ThemeView
} from './types';

export interface ParticipantLocations {
	cities: {
		name: string;
		county: string;
		count: number;
		lat: number;
		lng: number;
		major?: boolean;
	}[];
	other: number;
	total: number;
}

export interface ReportSources {
	slug: string;
	config: ReportConfig;
	images: { title: string; cta: string };
	bloomData: unknown;
	insights: unknown;
	groupInfo: unknown;
	groupStatements: unknown;
	consensus: unknown;
	themeDescriptions: unknown;
	demographics: unknown;
	participantLocations: unknown;
	counties: unknown;
}

export interface Report {
	slug: string;
	config: ReportConfig;
	images: { title: string; cta: string };

	themes: readonly Theme[];
	records: readonly ReportRecord[];
	groups: readonly Group[];
	insights: Record<string, Insight[]>;
	groupInfo: Record<string, GroupInfo>;
	/** Per group, the statements Polis says most define it, in rank order. */
	groupStatements: Record<string, { id: string; direction: string }[]>;
	themeDescriptions: Record<string, { description: string; note?: string }>;
	/** The Demographics detail modal, one category per tab. */
	demographics: Demographics;
	/**
	 * Cities with participant counts and real lat/lng for the Demographics map,
	 * plus an `other` bucket for every zip not broken out. Note d3-geo takes
	 * points as [lng, lat], the reverse of these fields' reading order.
	 */
	participantLocations: ParticipantLocations;
	/**
	 * County GeoJSON from the U.S. Census Bureau. Every county in the state is
	 * kept, not just the report's own, so the map's zoomed-out bound is the real
	 * state outline.
	 */
	counties: unknown;

	recordById: Map<string, ReportRecord>;
	themeByKey: Map<string, Theme>;
	/**
	 * Borrowed by the demographics modal's row swatches; it has no per-category
	 * colour of its own, so it cycles through the theme grid's palette.
	 */
	themeColors: string[];
	/** Each theme's ranked statements, computed once. */
	themeViews: Readonly<Record<string, ThemeView>>;
	/** The hand-picked common ground shown on the Consensus page, in order. */
	consensusRecords: readonly ReportRecord[];
}

export function buildReport(sources: ReportSources): Report {
	const bloomData = sources.bloomData as { themes: Theme[]; records: unknown[]; groups: Group[] };
	const themes = bloomData.themes as readonly Theme[];
	const records = bloomData.records as unknown as readonly ReportRecord[];
	const insights = sources.insights as Record<string, Insight[]>;
	const recordById = indexById(records);
	const consensus = sources.consensus as { ids: string[] };

	return {
		slug: sources.slug,
		config: sources.config,
		images: sources.images,

		themes,
		records,
		groups: bloomData.groups as readonly Group[],
		insights,
		groupInfo: sources.groupInfo as Record<string, GroupInfo>,
		groupStatements: sources.groupStatements as Record<string, { id: string; direction: string }[]>,
		themeDescriptions: (sources.themeDescriptions as { themes: Record<string, never> }).themes,
		demographics: sources.demographics as Demographics,
		participantLocations: sources.participantLocations as ParticipantLocations,
		counties: sources.counties,

		recordById,
		themeByKey: new Map(themes.map((theme) => [theme.key, theme])),
		themeColors: themes.map((theme) => theme.color),
		themeViews: Object.freeze(
			Object.fromEntries(
				themes.map((theme) => [
					theme.key,
					buildThemeView(records, theme, insights[theme.key] ?? [])
				])
			)
		),
		consensusRecords: Object.freeze(
			consensus.ids.map((id) => recordById.get(id)).filter((r): r is ReportRecord => Boolean(r))
		)
	};
}
