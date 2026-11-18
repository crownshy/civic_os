/**
 * Shared helpers for demographic setup and reporting. Question definitions and
 * Campaign selections come from Comhairle's versioned workflow steps.
 */

export const DEMOGRAPHIC_KEYS = ['age', 'ethnicity', 'gender', 'politicalParty'] as const;

export type DemographicKey = (typeof DEMOGRAPHIC_KEYS)[number];

export interface DemographicCategory {
	key: DemographicKey;
	/** Display name, as shown to the Host. */
	name: string;
	/** Read-only for default categories; the Host cannot edit these (#363). */
	options: string[];
}

/** Age buckets used when the participation report supplies a numeric answer. */
const AGE_BUCKETS = [
	{ label: 'Under 18', min: 0 },
	{ label: '18-24', min: 18 },
	{ label: '25-34', min: 25 },
	{ label: '35-44', min: 35 },
	{ label: '45-54', min: 45 },
	{ label: '55-64', min: 55 },
	{ label: '65+', min: 65 }
] as const;

/** The bucket label an age falls in, for reports that receive the raw number. */
export function ageToBucket(age: number): string {
	return [...AGE_BUCKETS].reverse().find((b) => age >= b.min)?.label ?? AGE_BUCKETS[0].label;
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
 * A demographics question as the Setup card shows it: a comhairle question,
 * either a system default or one the Host owns, keyed by its id.
 *
 * `enabled` is whether this Campaign asks it, which is a fact about the
 * Campaign's workflow (its demographics form, or a per-question step), not
 * about the question.
 */
export interface CustomDemographicCategory {
	id: string;
	displayName: string;
	options: string[];
	/** What to show instead of options for a question that has none, e.g. "Number". */
	answerFormat?: string;
	multipleSelection?: boolean;
	enabled: boolean;
}

/** Tidy an option label as typed: trimmed, with inner runs of whitespace collapsed. */
export function cleanOptionLabel(label: string): string {
	return label.trim().replace(/\s+/g, ' ');
}

// Participants and the report treat `Yes` and `yes` as one answer split in two,
// so options compare case- and spacing-blind.
function optionKey(label: string): string {
	return cleanOptionLabel(label).toLowerCase();
}

/**
 * The option `label` would repeat, or undefined when it is new. `skip` is the
 * index being edited, so a row never collides with itself.
 */
export function findRepeatedOption(
	label: string,
	options: readonly string[],
	skip = -1
): string | undefined {
	const key = optionKey(label);
	if (!key) return undefined;
	return options.find((option, i) => i !== skip && optionKey(option) === key);
}

/** Indexes of options that repeat an earlier one, e.g. in a category saved before this check. */
export function repeatedOptionIndexes(options: readonly string[]): Set<number> {
	const seen = new Set<string>();
	const repeats = new Set<number>();
	options.forEach((option, i) => {
		const key = optionKey(option);
		if (!key) return;
		if (seen.has(key)) repeats.add(i);
		seen.add(key);
	});
	return repeats;
}

/** One distinct answer in a participation report, and how many participants gave it. */
export interface DemographicAnswerCount {
	/**
	 * The answer as comhairle stored it: a number, a string, or for a select
	 * question `{ option_ids, other_text?, prefer_not_to_say? }`. Empty for the
	 * participants who skipped the question, which is why every caller supplies
	 * its own "Not Provided" label.
	 */
	value: unknown;
	count: number;
}

/** The answers to one question in a participation report. */
export interface DemographicQuestionCounts {
	questionId: string;
	/** The question's latest published text. */
	text: string;
	answers: DemographicAnswerCount[];
}

/** What `GetConversationWorkflowParticipationReport` returns, shaped. */
export interface ParticipationReport {
	totalParticipants: number;
	/**
	 * Question id to answer counts, for every question the Campaign's workflow
	 * asks, through its demographics form or a per-question step. Answers are
	 * grouped by stored value, not by label: a select answer carries option ids.
	 */
	questions: Record<string, DemographicQuestionCounts>;
}

function readAnswerCounts(value: unknown): DemographicAnswerCount[] {
	if (!Array.isArray(value)) return [];

	return value.filter(
		(entry): entry is DemographicAnswerCount =>
			!!entry &&
			typeof entry === 'object' &&
			typeof (entry as { count?: unknown }).count === 'number'
	);
}

/**
 * The participation report, narrowed. A report missing a question, or carrying
 * a malformed one, should render an empty table rather than throw.
 */
export function readParticipationReport(report: unknown): ParticipationReport {
	const bag = report && typeof report === 'object' ? (report as Record<string, unknown>) : {};
	const total = bag.total_participants;
	const rawQuestions =
		bag.questions && typeof bag.questions === 'object'
			? (bag.questions as Record<string, unknown>)
			: {};

	const questions: Record<string, DemographicQuestionCounts> = {};
	for (const [id, raw] of Object.entries(rawQuestions)) {
		if (!raw || typeof raw !== 'object') continue;
		const entry = raw as Record<string, unknown>;
		questions[id] = {
			questionId: id,
			text: typeof entry.text === 'string' ? entry.text : '',
			answers: readAnswerCounts(entry.answers)
		};
	}

	return { totalParticipants: typeof total === 'number' ? total : 0, questions };
}
