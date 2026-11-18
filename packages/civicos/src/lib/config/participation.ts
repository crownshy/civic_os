import {
	ASK_KEYS,
	readAskToggles,
	type AskKey,
	type AskToggles
} from '@civicos/shared/data/participant-asks';

export { DEFAULT_ASK_TOGGLES } from '@civicos/shared/data/participant-asks';
export type { AskKey, AskToggles };

export interface Participation {
	asks: AskToggles;
}

export interface ParticipationConversation {
	metadata?: unknown;
}

/** Participant asks are metadata; demographics come from workflow questions. */
export function resolveParticipation(
	conversation: ParticipationConversation | null | undefined
): Participation {
	return { asks: readAskToggles(conversation?.metadata) };
}

/** The asks still switched on, in checkpoint order. */
export function askedVariants(asks: AskToggles): AskKey[] {
	return ASK_KEYS.filter((key) => asks[key]);
}
