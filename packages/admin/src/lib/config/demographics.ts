/**
 * Demographic categories a Host can switch on or off.
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

export const DEMOGRAPHIC_CATEGORIES: DemographicCategory[] = [
	{
		key: 'age',
		name: 'Age',
		options: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', 'Above 65']
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
 * ⚠️ Nothing asks these of a participant yet. civicos's `AboutYouScreen`
 * collects the four fixed fields against hardcoded question ids, so a custom
 * category is stored and shown back to the Host but never reaches the poll
 * until civicos reads its config from the API (#398) and its collection UI is
 * made dynamic.
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
