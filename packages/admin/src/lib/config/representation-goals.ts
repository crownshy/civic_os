/**
 * Hardcoded representation goals per region.
 *
 * Keys MUST match the `value` strings the comhairle participation_report
 * returns for each demographic category. See `aboutYouQuestions` in
 * packages/civicos/src/lib/data/mock.ts for the option labels participants
 * actually pick from.
 */

export interface RegionGoals {
	totalParticipants: number;
	ethnicity: Record<string, number>;
	politicalParty: Record<string, number>;
	ageRanges: Record<string, number>;
	gender: Record<string, number>;
}

const oregon: RegionGoals = {
	totalParticipants: 300,
	ethnicity: {
		'Asian / Pacific Islander': 4,
		'Black or African American': 1,
		'Hispanic or Latino': 31,
		'Middle Eastern / North African': 0,
		Multiracial: 15,
		'Native American': 10,
		Other: 1,
		'White or Caucasian': 233
	},
	politicalParty: {
		'Democrat / Progressive / Liberal': 74,
		'No Party Preference / Independent': 99,
		'Republican / Conservative': 126
	},
	ageRanges: {
		'18-24': 28,
		'25-34': 48,
		'35-44': 51,
		'45-54': 43,
		'55-64': 52,
		'65+': 75
	},
	gender: {
		Female: 150,
		Male: 149,
		Other: 0
	}
};

const utah: RegionGoals = {
	totalParticipants: 0,
	ethnicity: {},
	politicalParty: {},
	ageRanges: {},
	gender: {}
};

export const REPRESENTATION_GOALS: Record<string, RegionGoals> = {
	oregon,
	utah
};

export function getRegionGoals(slug: string): RegionGoals | null {
	return REPRESENTATION_GOALS[slug] ?? null;
}
