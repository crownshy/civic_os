/**
 * Demographic categories a Host can switch on or off.
 *
 * This is the definition both apps read: `admin` renders the switches on Setup
 * and writes them to `metadata`, `civicos` builds its About You screen from the
 * categories the switches leave on. It lives here so the app that configures a
 * category and the app that asks it cannot disagree about its options, the same
 * contract `place.ts` draws for a Place (ADR 0003).
 *
 * The four keys are fixed because both ends of the pipe are fixed: civicos's
 * `AboutYouScreen` collects exactly these fields, and comhairle's
 * `DemographicReport` buckets them under the same names. Custom categories need
 * backend tables (Demographic Question / Question Option) and are #364.
 *
 * INTERIM STORAGE. The on/off state lives in `conversation.metadata.demographics`
 * because there is nowhere else to put it today. When the backend promotes
 * demographics to a real entity model, this is read once and dropped. See #363.
 */

export const DEMOGRAPHIC_KEYS = ['age', 'ethnicity', 'gender', 'politicalParty'] as const;

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
 * A Host-authored category (#364).
 *
 * Kept in a separate `customDemographics` array rather than folded into the
 * `demographics` booleans, because the two are different kinds of thing today:
 * the four defaults map onto comhairle's `DemographicReport` buckets and have
 * fixed options, while these map onto nothing at all and carry their own.
 *
 * ⚠️ Nothing asks these of a participant yet. civicos builds its About You
 * screen from the four fixed categories above and the profile upsert has a
 * column for each; a custom category maps onto neither, so it is stored and
 * shown back to the Host but never reaches the poll. #364 carries it.
 */
export interface CustomDemographicCategory {
	/** Slug derived from the name at creation; stable across renames. */
	key: string;
	name: string;
	options: string[];
	enabled: boolean;
}

/** Slugify a category name into a metadata key. */
export function toDemographicKey(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function isCustomCategory(v: unknown): v is CustomDemographicCategory {
	if (!v || typeof v !== 'object') return false;
	const c = v as Record<string, unknown>;
	return (
		typeof c.key === 'string' &&
		typeof c.name === 'string' &&
		Array.isArray(c.options) &&
		c.options.every((o) => typeof o === 'string')
	);
}

/** Read Host-authored categories out of the untyped `metadata` jsonb. */
export function readCustomDemographics(metadata: unknown): CustomDemographicCategory[] {
	const bag =
		metadata && typeof metadata === 'object'
			? (metadata as Record<string, unknown>).customDemographics
			: null;
	if (!Array.isArray(bag)) return [];

	return bag.filter(isCustomCategory).map((c) => ({
		key: c.key,
		name: c.name,
		options: c.options,
		enabled: typeof c.enabled === 'boolean' ? c.enabled : true
	}));
}

/** Reserved keys a new category cannot collide with. */
export function isKeyTaken(key: string, existing: CustomDemographicCategory[]): boolean {
	return (
		(DEMOGRAPHIC_KEYS as readonly string[]).includes(key) || existing.some((c) => c.key === key)
	);
}
