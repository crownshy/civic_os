/**
 * Representation-goal shape + canonical bucket lists.
 *
 * Goal *values* are now loaded per-workflow from comhairle's
 * `recruitment_targets` API (see participants/+page.server.ts).
 * The bucket *labels* below define the categories an admin can edit
 * in the Modify Goals modal — they must match the `value` strings that
 * the participation_report SQL returns so counts and goals line up.
 */

export interface RegionGoals {
	totalParticipants: number;
	ethnicity: Record<string, number>;
	politicalParty: Record<string, number>;
	ageRanges: Record<string, number>;
	gender: Record<string, number>;
}

export type GoalMetric =
	| 'totalParticipants'
	| 'ethnicity'
	| 'politicalParty'
	| 'ageRanges'
	| 'gender';

export const TOTAL_PARTICIPANTS_BUCKET = 'total';

export const METRIC_BUCKETS: Record<Exclude<GoalMetric, 'totalParticipants'>, string[]> = {
	ethnicity: [
		'White or Caucasian',
		'Black or African American',
		'Hispanic or Latino',
		'Asian / Pacific Islander',
		'Native American',
		'Middle Eastern / North African',
		'Multiracial',
		'Other'
	],
	politicalParty: [
		'Democrat / Progressive / Liberal',
		'No Party Preference / Independent',
		'Republican / Conservative'
	],
	ageRanges: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
	gender: ['Female', 'Male', 'Other']
};

export const METRIC_LABELS: Record<GoalMetric, string> = {
	totalParticipants: 'Total Participants',
	ethnicity: 'Race / Ethnicity',
	gender: 'Gender',
	politicalParty: 'Political Affiliation',
	ageRanges: 'Age'
};

export function emptyGoals(): RegionGoals {
	return {
		totalParticipants: 0,
		ethnicity: {},
		politicalParty: {},
		ageRanges: {},
		gender: {}
	};
}
