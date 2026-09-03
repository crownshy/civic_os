/**
 * The shapes carried by `data/*.json`.
 *
 * These describe the bundled Oregon dataset as it is written today by
 * public-reports' refresh-poll.js. When the report's data starts coming from
 * Comhairle instead, this is the file that changes; everything downstream
 * works off these types rather than off the JSON.
 */

/** One opinion group's tally on one statement. */
export interface GroupTally {
	/** agrees */
	a: number;
	/** disagrees */
	d: number;
	/** passes */
	p: number;
	/** votes this group cast on this statement (a + d + p) */
	n: number;
	/** agree %, over this group's votes on this statement */
	pct: number;
}

/**
 * A statement's vote summary: three named totals plus one `GroupTally` per
 * declared group key ("A", "B", "C"), which is data rather than constants;
 * see `Group`.
 *
 * The index signature has to admit the numeric summary fields too, so reading
 * a group off a vote goes through `tallyFor()` rather than indexing directly.
 */
export type Vote = {
	/** every vote cast on this statement, across all groups */
	readonly total: number;
	/** max agree% − min agree%, so the ceiling needs no field of its own */
	readonly gap: number;
	/** the agree% of the group that agrees least */
	readonly minAgree: number;
} & {
	readonly [groupKey: string]: GroupTally | number;
};

export type RecordKind = 'poll' | 'quote';

export type RecordOrigin = 'cocap_seed' | 'listening_session' | 'participant';

/** A statement or a session quote. Quotes carry `vote: null`. */
export interface ReportRecord {
	id: string;
	kind: RecordKind;
	text: string;
	origin: RecordOrigin;
	place: string | null;
	/** raw ALL-CAPS labels: demographics, session name, date */
	chips: string[];
	vote: Vote | null;
	source: string;
	/** editorial; a theme claims records by tag (see `recordsForTheme`) */
	tags: string[];
	inReport: boolean;
}

export interface Theme {
	key: string;
	short: string;
	full: string;
	color: string;
	/** a record carrying any of these belongs to this theme */
	tags: string[];
}

/**
 * Opinion groups come from Polis's clustering, which re-runs as votes arrive:
 * both how many there are and which is which can change between refreshes.
 * Nothing may assume two, or assume "A" means what it meant last time; the
 * labels are data, reapplied editorially after each refresh.
 */
export interface Group {
	key: string;
	label: string;
}

/** A `Group` with one statement's tally merged onto it. */
export type GroupWithTally = Group & Partial<GroupTally>;

export type InsightDirection = 'agree' | 'disagree' | 'divided' | 'mixed';

/** An editorial claim about a theme, citing statements as its evidence. */
export interface Insight {
	claim: string;
	direction: InsightDirection;
	ids: string[];
}

/** Hand-maintained per-group display data, keyed by group key. */
export interface GroupInfo {
	participants: number;
	color: string;
	tagline: string;
	description: string;
}

/** A theme's records, resolved and ordered for rendering. */
export interface ThemeView {
	/** poll statements only, in display order */
	readonly statements: readonly ReportRecord[];
	/** `statements`, plus any insight-cited record not already among them */
	readonly items: readonly ReportRecord[];
}
