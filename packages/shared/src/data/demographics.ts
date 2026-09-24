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
			type: 'string' as const,
			options: [
				{ value: 'Under 18', label: 'Under 18' },
				{ value: '18-24', label: '18-24' },
				{ value: '25-34', label: '25-34' },
				{ value: '35-44', label: '35-44' },
				{ value: '45-54', label: '45-54' },
				{ value: '55-64', label: '55-64' },
				{ value: '65+', label: '65+' }
			]
		}
	},
	{
		slug: 'ethnicity',
		displayName: 'Ethnicity',
		responseType: 'string' as const,
		bucketConfig: {
			type: 'string' as const,
			options: [
				{ value: 'Black / African American', label: 'Black / African American' },
				{ value: 'Asian American / Pacific Islander', label: 'Asian American / Pacific Islander' },
				{ value: 'Middle Eastern / North African', label: 'Middle Eastern / North African' },
				{ value: 'White', label: 'White' },
				{ value: 'Hispanic', label: 'Hispanic' }
			]
		}
	},
	{
		slug: 'gender',
		displayName: 'Gender',
		responseType: 'string' as const,
		bucketConfig: {
			type: 'string' as const,
			options: [
				{ value: 'Male', label: 'Male' },
				{ value: 'Female', label: 'Female' },
				{ value: 'Nonbinary', label: 'Nonbinary' },
				{ value: 'Other', label: 'Other' }
			]
		}
	},
	{
		slug: 'political_party',
		displayName: 'Political Party',
		responseType: 'string' as const,
		bucketConfig: {
			type: 'string' as const,
			options: [
				{ value: 'Progressive', label: 'Progressive' },
				{ value: 'Liberal', label: 'Liberal' },
				{ value: 'Moderate', label: 'Moderate' },
				{ value: 'Conservative', label: 'Conservative' },
				{ value: 'Other', label: 'Other' }
			]
		}
	}
];

export const DEFAULT_DEMOGRAPHIC_SLUGS = DEFAULT_DEMOGRAPHIC_QUESTIONS.map(
	(question) => question.slug
);

/**
 * Question slugs a Host does not own, and so may not edit, remove or reuse.
 *
 * The four defaults, plus `zipcode`. Comhairle seeds that one alongside them,
 * but civicos collects the zip at join rather than on About You, so a switch
 * over it on Setup governs nothing, and the Remove button beside it deletes the
 * question every participant's zip is filed against.
 */
export const RESERVED_DEMOGRAPHIC_SLUGS = [...DEFAULT_DEMOGRAPHIC_SLUGS, 'zipcode'];

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
 * Bucket midpoints, except `65+`, which is open-ended and has none: 70 is a
 * stand-in, and skews younger than the 74 / 85 the two old top buckets
 * carried. Rows saved before this change keep their old numbers.
 *
 * The labels are comhairle's, not ours. It buckets `age` itself for the
 * participation report, so its `65+` is what admin's representation goals key
 * off and what the report prints; civicos saying `Above 65` on About You meant
 * the same bucket had two names depending on which screen you were looking at.
 * Renaming is safe because the label and the number it stores are one row: the
 * pairing is what #426 put here so a rename cannot leave a bucket saving
 * `undefined`.
 */
const AGE_BUCKETS = [
	{ label: 'Under 18', age: 16 },
	{ label: '18-24', age: 21 },
	{ label: '25-34', age: 29 },
	{ label: '35-44', age: 39 },
	{ label: '45-54', age: 49 },
	{ label: '55-64', age: 59 },
	{ label: '65+', age: 70 }
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

/**
 * The answer options a question offers, or an empty list when it carries none.
 *
 * A question with no `bucketConfig` is not a malformed one: comhairle only
 * bucket-configures `age`, so the other seeded defaults arrive bare and admin
 * restores them. Reading the two shapes in one place keeps that repair and the
 * Setup card agreeing on what "has no options" means.
 */
export function bucketOptions(question: DemographicQuestionData): string[] {
	const config = question.bucketConfig;
	if (!config) return [];

	return config.type === 'string'
		? config.options.map((option) => option.label)
		: config.buckets.map((bucket) => bucket.label);
}

/** Whether a question offers anything to pick from. */
export function hasBucketOptions(question: DemographicQuestionData): boolean {
	return bucketOptions(question).length > 0;
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
		options: bucketOptions(question),
		enabled: enabledSlugs.has(question.slug)
	}));
}

/** Return only Host-authored questions, excluding comhairle's seeded defaults. */
export function customDemographicsFromBackend(
	questions: DemographicQuestionData[],
	relationships: ConversationDemographicData[]
): CustomDemographicCategory[] {
	return demographicsFromBackend(questions, relationships).filter(
		(question) => !(RESERVED_DEMOGRAPHIC_SLUGS as readonly string[]).includes(question.slug)
	);
}

/** Reserved keys a new category cannot collide with. */
export function isKeyTaken(slug: string, existing: CustomDemographicCategory[]): boolean {
	return (
		(RESERVED_DEMOGRAPHIC_SLUGS as readonly string[]).includes(slug) ||
		existing.some((category) => category.slug === slug)
	);
}

/**
 * One answer bucket in a participation report, and how many participants gave
 * it. `value` is absent or null for the ones who skipped the question, which is
 * why every caller supplies its own "Not Provided" label.
 */
export interface DemographicCategoryCount {
	value?: string | null;
	count: number;
}

/** The per-question breakdowns `GetConversationWorkflowParticipationReport` returns. */
export interface ParticipationDemographics {
	totalParticipants: number;
	ageRanges: DemographicCategoryCount[];
	ethnicity: DemographicCategoryCount[];
	gender: DemographicCategoryCount[];
	politicalParty: DemographicCategoryCount[];
	/** Zip code to participant count, before any roll-up. */
	zipcodeCounts: Record<string, number>;
}

const PARTICIPATION_CATEGORY_KEYS = [
	'ageRanges',
	'ethnicity',
	'gender',
	'politicalParty'
] as const satisfies readonly (keyof ParticipationDemographics)[];

function readCategoryCounts(value: unknown): DemographicCategoryCount[] {
	if (!Array.isArray(value)) return [];

	return value.filter(
		(entry): entry is DemographicCategoryCount =>
			!!entry &&
			typeof entry === 'object' &&
			typeof (entry as { count?: unknown }).count === 'number'
	);
}

function readZipcodeCounts(value: unknown): Record<string, number> {
	if (!value || typeof value !== 'object') return {};

	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).filter(
			(entry): entry is [string, number] => typeof entry[1] === 'number'
		)
	);
}

/**
 * The participation report, shaped.
 *
 * The backend sends each breakdown as a top-level key, but the generated
 * `DemographicReport` schema declares only `categories` and `totalParticipants`
 * and lets the rest through `.passthrough()`. Everything a caller actually
 * reads therefore arrives as `unknown`. Narrowing here rather than casting at
 * each read keeps one description of the shape, and means a backend that stops
 * sending a key renders an empty section instead of throwing.
 */
export function readParticipationDemographics(report: unknown): ParticipationDemographics {
	const bag = report && typeof report === 'object' ? (report as Record<string, unknown>) : {};
	const totalParticipants = bag.totalParticipants;

	return {
		totalParticipants: typeof totalParticipants === 'number' ? totalParticipants : 0,
		...PARTICIPATION_CATEGORY_KEYS.reduce(
			(acc, key) => {
				acc[key] = readCategoryCounts(bag[key]);
				return acc;
			},
			{} as Record<(typeof PARTICIPATION_CATEGORY_KEYS)[number], DemographicCategoryCount[]>
		),
		zipcodeCounts: readZipcodeCounts(bag.zipcodeCounts)
	};
}
