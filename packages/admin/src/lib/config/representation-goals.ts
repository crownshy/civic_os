/**
 * Representation-goal shape. Goal values are loaded per workflow from
 * comhairle's recruitment targets (see participants/+page.server.ts); the
 * buckets a goal can be set against are each question's options.
 */

export interface RegionGoals {
	totalParticipants: number;
	ethnicity: Record<string, number>;
	politicalParty: Record<string, number>;
	ageRanges: Record<string, number>;
	gender: Record<string, number>;
	/** Geography goals, keyed by county name (buckets are per-region, not static). */
	county: Record<string, number>;
	/** Host-authored demographic question slug to option goals. */
	custom: Record<string, Record<string, number>>;
}

export type GoalMetric =
	'totalParticipants' | 'ethnicity' | 'politicalParty' | 'ageRanges' | 'gender' | 'county';

export const TOTAL_PARTICIPANTS_BUCKET = 'total';

/** Titles for the two goals that are not a demographic question. */
export const METRIC_LABELS: Partial<Record<GoalMetric, string>> = {
	totalParticipants: 'Total Participants',
	county: 'Geography'
};

export function emptyGoals(): RegionGoals {
	return {
		totalParticipants: 0,
		ethnicity: {},
		politicalParty: {},
		ageRanges: {},
		gender: {},
		county: {},
		custom: {}
	};
}
