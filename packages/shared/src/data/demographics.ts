/**
 * Demographic categories a Host can switch on or off.
 *
 * Admin reads question definitions and enabled relationships from comhairle.
 * The legacy constants below remain for civicos until its participant response
 * flow moves from profile columns to first-class demographics responses.
 *
 * The four keys are fixed because both ends of the pipe are fixed: civicos's
 * `AboutYouScreen` collects exactly these fields, and comhairle's
 * `DemographicReport` buckets them under the same names. Custom categories use
 * comhairle's demographics question model.
 *
 * `conversation.metadata.demographics` is now only a civicos compatibility
 * fallback. Admin uses the ConversationDemographics relationship.
 */

export const DEMOGRAPHIC_KEYS = ['age', 'ethnicity', 'gender', 'politicalParty'] as const;

/** Question definitions seeded by comhairle's first-class demographics migrations. */
export const DEFAULT_DEMOGRAPHIC_QUESTIONS = [
	{
		slug: 'age',
		displayName: 'Age',
		responseType: 'number' as const,
		bucketConfig: {
			type: 'numeric' as const,
			buckets: [
				{ label: 'Under 18', min: null, max: 17 },
				{ label: '18-24', min: 18, max: 24 },
				{ label: '25-34', min: 25, max: 34 },
				{ label: '35-44', min: 35, max: 44 },
				{ label: '45-54', min: 45, max: 54 },
				{ label: '55-64', min: 55, max: 64 },
				{ label: '65+', min: 65, max: null }
			]
		}
	},
	{ slug: 'ethnicity', displayName: 'Ethnicity', responseType: 'string' as const },
	{ slug: 'gender', displayName: 'Gender', responseType: 'string' as const },
	{
		slug: 'political_party',
		displayName: 'Political Party',
		responseType: 'string' as const
	}
];

export const DEFAULT_DEMOGRAPHIC_SLUGS = DEFAULT_DEMOGRAPHIC_QUESTIONS.map(
	(question) => question.slug
);

export type DemographicKey = (typeof DEMOGRAPHIC_KEYS)[number];

export type DemographicToggles = Record<DemographicKey, boolean>;

export interface DemographicCategory {
	key: DemographicKey;
	/** Display name, as shown to the Host. */
	name: string;
	/** Read-only for default categories; the Host cannot edit these (#363). */
	options: string[];
}

/**
 * The age buckets, each with the number stored for it.
 *
 * Comhairle stores `age` as a number, so the label a participant picks has to
 * collapse to one before the profile upsert. Label and number live on the same
 * row rather than in a parallel map, because a parallel map is exactly how the
 * two lists drifted apart in the first place: a renamed bucket that missed the
 * map saved `undefined` for everyone in it (#426).
 *
 * Bucket midpoints, except `Above 65`, which is open-ended and has none: 70
 * is a stand-in, and skews younger than the 74 / 85 the two old top buckets
 * carried. Rows saved before this change keep their old numbers.
 */
const AGE_BUCKETS = [
	{ label: 'Under 18', age: 16 },
	{ label: '18-24', age: 21 },
	{ label: '25-34', age: 29 },
	{ label: '35-44', age: 39 },
	{ label: '45-54', age: 49 },
	{ label: '55-64', age: 59 },
	{ label: 'Above 65', age: 70 }
] as const;

/** The number to store for a picked age bucket, or undefined for any other label. */
export function ageBucketToNumber(bucket: string): number | undefined {
	return AGE_BUCKETS.find((b) => b.label === bucket)?.age;
}

export const DEMOGRAPHIC_CATEGORIES: DemographicCategory[] = [
	{
		key: 'age',
		name: 'Age',
		options: AGE_BUCKETS.map((b) => b.label)
	},
	{
		key: 'ethnicity',
		name: 'Race / Ethnicity',
		options: [
			'Black / African American',
			'Asian American / Pacific Islander',
			'Middle Eastern / North African',
			'White',
			'Hispanic'
		]
	},
	{ key: 'gender', name: 'Gender', options: ['Male', 'Female', 'Nonbinary', 'Other'] },
	{
		key: 'politicalParty',
		name: 'Political Affiliation',
		options: ['Progressive', 'Liberal', 'Moderate', 'Conservative', 'Other']
	}
];

/**
 * All on. A conversation with no metadata should behave exactly as it does
 * today, and civicos asks all four questions today.
 */
export const DEFAULT_TOGGLES: DemographicToggles = {
	age: true,
	ethnicity: true,
	gender: true,
	politicalParty: true
};

/** Read the toggles out of the untyped `metadata` jsonb, falling back per key. */
export function readDemographicToggles(metadata: unknown): DemographicToggles {
	const bag =
		metadata && typeof metadata === 'object'
			? (metadata as Record<string, unknown>).demographics
			: null;
	const stored = bag && typeof bag === 'object' ? (bag as Record<string, unknown>) : {};

	return DEMOGRAPHIC_KEYS.reduce((acc, key) => {
		acc[key] = typeof stored[key] === 'boolean' ? (stored[key] as boolean) : DEFAULT_TOGGLES[key];
		return acc;
	}, {} as DemographicToggles);
}

/**
 * A Host-authored category backed by a comhairle demographics question.
 * `enabled` is derived from the ConversationDemographics relationship rather
 * than stored on the question itself.
 */
export interface CustomDemographicCategory {
	slug: string;
	displayName: string;
	options: string[];
	enabled: boolean;
}

/** The generated API fields needed to render a demographics question. */
export interface DemographicQuestionData {
	slug: string;
	displayName: string;
	bucketConfig?:
		| { type: 'string'; options: { label: string; value: string }[] }
		| { type: 'numeric'; buckets: { label: string; min?: number | null; max?: number | null }[] }
		| null;
}

/** The generated API fields that enable a question for a Conversation. */
export interface ConversationDemographicData {
	conversationId: string;
	questionSlug: string;
}

/** Slugify a category name for the backend question model. */
export function toDemographicSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Convert backend questions and relationship rows into Setup card categories. */
export function demographicsFromBackend(
	questions: DemographicQuestionData[],
	relationships: ConversationDemographicData[]
): CustomDemographicCategory[] {
	const enabledSlugs = new Set(relationships.map((relationship) => relationship.questionSlug));

	return questions.map((question) => ({
			slug: question.slug,
			displayName: question.displayName,
			options:
				question.bucketConfig?.type === 'string'
					? question.bucketConfig.options.map((option) => option.label)
					: (question.bucketConfig?.buckets.map((bucket) => bucket.label) ?? []),
			enabled: enabledSlugs.has(question.slug)
		}));
}

/** Return only Host-authored questions, excluding comhairle's seeded defaults. */
export function customDemographicsFromBackend(
	questions: DemographicQuestionData[],
	relationships: ConversationDemographicData[]
): CustomDemographicCategory[] {
	return demographicsFromBackend(questions, relationships).filter(
		(question) => !(DEFAULT_DEMOGRAPHIC_SLUGS as readonly string[]).includes(question.slug)
	);
}

/** Reserved keys a new category cannot collide with. */
export function isKeyTaken(slug: string, existing: CustomDemographicCategory[]): boolean {
	return (
		(DEFAULT_DEMOGRAPHIC_SLUGS as readonly string[]).includes(slug) ||
		existing.some((category) => category.slug === slug)
	);
}
