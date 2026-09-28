/**
 * What this Campaign asks a participant for: which demographic categories the
 * About You screen collects, and which of the four asks the poll makes.
 *
 * Both are Host switches set on Setup in admin. The asks are stored on the
 * Conversation's `metadata`. The demographics are comhairle's
 * ConversationDemographics links, read by `/contribute`'s load and turned into
 * questions by `aboutYouQuestionsFromBackend` (#441). The old
 * `metadata.demographics` switches admin no longer writes are only the fallback
 * for when those links cannot be read.
 *
 * This file is the single civicos read site, the way `place.ts` is for a Place
 * (ADR 0006). A Conversation with no metadata reads as all on, so a Campaign
 * nobody has configured behaves exactly as the poll did before any of this
 * existed.
 */

import {
	DEFAULT_DEMOGRAPHIC_QUESTIONS,
	DEMOGRAPHIC_CATEGORIES,
	RESERVED_DEMOGRAPHIC_SLUGS,
	readDemographicToggles,
	type DemographicKey,
	type DemographicQuestionData,
	type DemographicToggles
} from '@civicos/shared/data/demographics';
import {
	ASK_KEYS,
	readAskToggles,
	type AskKey,
	type AskToggles
} from '@civicos/shared/data/participant-asks';

export { ageBucketToNumber, DEFAULT_TOGGLES } from '@civicos/shared/data/demographics';
export { DEFAULT_ASK_TOGGLES } from '@civicos/shared/data/participant-asks';
export type { AskKey, AskToggles, DemographicKey, DemographicToggles };

export interface Participation {
	demographics: DemographicToggles;
	asks: AskToggles;
}

/** The fields of a Conversation these switches are read from. */
export interface ParticipationConversation {
	metadata?: unknown;
}

export function resolveParticipation(
	conversation: ParticipationConversation | null | undefined
): Participation {
	return {
		demographics: readDemographicToggles(conversation?.metadata),
		asks: readAskToggles(conversation?.metadata)
	};
}

/** One pickable answer: `value` is what is stored, `label` what is shown. */
export interface AboutYouOption {
	value: string;
	label: string;
}

/** One card on the About You screen: a category, and the options it offers. */
export interface AboutYouQuestion {
	/** The comhairle question slug. Answers are keyed by it. */
	key: string;
	/** Category name, as the Host sees it in admin. */
	title: string;
	/** The question itself, inside the dialog. */
	prompt: string;
	options: AboutYouOption[];
	/**
	 * Set for the four built-in categories. Their answers go through the profile
	 * upsert, which is what comhairle's participation report reads. Null for a
	 * Host's own category, which is filed as a demographics response.
	 */
	profileField: DemographicKey | null;
}

/** The built-in question slugs, and the profile field each one is filed under. */
const PROFILE_FIELD_BY_SLUG: Record<string, DemographicKey> = {
	age: 'age',
	ethnicity: 'ethnicity',
	gender: 'gender',
	political_party: 'politicalParty'
};

const SLUG_BY_PROFILE_FIELD = Object.fromEntries(
	Object.entries(PROFILE_FIELD_BY_SLUG).map(([slug, field]) => [field, slug])
) as Record<DemographicKey, string>;

/**
 * How each category is phrased to a participant. Admin owns the category and
 * its options; the wording of the question is participant-facing copy that
 * admin has no field for, so it stays here keyed by the shared category.
 */
const PROMPTS: Record<DemographicKey, string> = {
	age: 'What is your age?',
	ethnicity: 'What is your ethnicity?',
	gender: 'What is your gender identity?',
	politicalParty: 'Which of the following best describes your political leaning?'
};

/** A Host's own category has no wording of its own, only a name and options. */
const CUSTOM_PROMPT = 'Choose the answer that fits you best.';

const asOptions = (labels: readonly string[]): AboutYouOption[] =>
	labels.map((label) => ({ value: label, label }));

/**
 * The About You screen for a set of switches, in the order admin lists the
 * categories. The fallback for when the Campaign's own questions could not be
 * read: a legacy region, or a backend that did not answer.
 */
export function aboutYouQuestionsFor(demographics: DemographicToggles): AboutYouQuestion[] {
	return DEMOGRAPHIC_CATEGORIES.filter((category) => demographics[category.key]).map(
		(category) => ({
			key: SLUG_BY_PROFILE_FIELD[category.key],
			title: category.name,
			prompt: PROMPTS[category.key],
			options: asOptions(category.options),
			profileField: category.key
		})
	);
}

function optionsOf(question: DemographicQuestionData): AboutYouOption[] {
	const config = question.bucketConfig;
	if (!config) return [];
	return config.type === 'string'
		? config.options.map(({ value, label }) => ({ value, label }))
		: asOptions(config.buckets.map((bucket) => bucket.label));
}

/**
 * The About You screen from the questions the Host switched on for this
 * Campaign in admin (`GetDemographicsQuestions` filtered by conversation, which
 * returns only the linked ones). Empty means the Host wants no demographics at
 * all, and the caller skips the screen rather than showing an empty one.
 *
 * Built-ins come first in their usual order, then the Host's own in the order
 * comhairle lists them. A built-in whose stored options are missing falls back
 * to the checked-in list, the same repair admin makes. A question with no
 * options at all has nothing to pick and is left out, and so is `zipcode`,
 * which is asked at join.
 */
export function aboutYouQuestionsFromBackend(
	questions: readonly DemographicQuestionData[]
): AboutYouQuestion[] {
	const builtIns = DEFAULT_DEMOGRAPHIC_QUESTIONS.flatMap((seed) => {
		const stored = questions.find((question) => question.slug === seed.slug);
		if (!stored) return [];
		const field = PROFILE_FIELD_BY_SLUG[seed.slug];
		const options = optionsOf(stored);
		return [
			{
				key: seed.slug,
				title: stored.displayName || seed.displayName,
				prompt: PROMPTS[field],
				options: options.length ? options : optionsOf(seed),
				profileField: field
			}
		];
	});

	const custom = questions
		.filter((question) => !RESERVED_DEMOGRAPHIC_SLUGS.includes(question.slug))
		.map((question) => ({
			key: question.slug,
			title: question.displayName,
			prompt: CUSTOM_PROMPT,
			options: optionsOf(question),
			profileField: null
		}))
		.filter((question) => question.options.length > 0);

	return [...builtIns, ...custom];
}

/**
 * The asks still switched on, in checkpoint order. The keys are the same union
 * as `CheckpointScreen`'s `CheckpointVariant`, which is what makes one switch
 * govern both the mid-poll pause and the end-page card.
 */
export function askedVariants(asks: AskToggles): AskKey[] {
	return ASK_KEYS.filter((key) => asks[key]);
}
