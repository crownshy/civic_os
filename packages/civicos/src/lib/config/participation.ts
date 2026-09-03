/**
 * What this Campaign asks a participant for: which demographic categories the
 * About You screen collects, and which of the four asks the poll makes.
 *
 * Both sets are Host switches, set on Setup in admin and stored on the
 * Conversation's `metadata`. The definitions and the readers are
 * `@civicos/shared/data/demographics` and `.../participant-asks`, shared so the
 * app that writes a switch and the app that obeys it cannot drift; this file is
 * the single civicos read site, the way `place.ts` is for a Place (ADR 0003).
 *
 * A Conversation with no metadata reads as all on, so a Campaign nobody has
 * configured behaves exactly as the poll did before any of this existed.
 */

import {
	DEMOGRAPHIC_CATEGORIES,
	readDemographicToggles,
	type DemographicKey,
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

/** One card on the About You screen: a category, and the options it offers. */
export interface AboutYouQuestion {
	key: DemographicKey;
	/** Category name, as the Host sees it in admin. */
	title: string;
	/** The question itself, inside the dialog. */
	prompt: string;
	options: string[];
}

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

/**
 * The About You screen for a set of switches, in the order admin lists the
 * categories. Empty means the Host wants no demographics at all, and the
 * caller skips the screen rather than showing an empty one.
 */
export function aboutYouQuestionsFor(demographics: DemographicToggles): AboutYouQuestion[] {
	return DEMOGRAPHIC_CATEGORIES.filter((category) => demographics[category.key]).map(
		(category) => ({
			key: category.key,
			title: category.name,
			prompt: PROMPTS[category.key],
			options: category.options
		})
	);
}

/**
 * The asks still switched on, in checkpoint order. The keys are the same union
 * as `CheckpointScreen`'s `CheckpointVariant`, which is what makes one switch
 * govern both the mid-poll pause and the end-page card.
 */
export function askedVariants(asks: AskToggles): AskKey[] {
	return ASK_KEYS.filter((key) => asks[key]);
}
