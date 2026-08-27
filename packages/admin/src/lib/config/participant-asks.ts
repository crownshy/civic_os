/**
 * The four things civicos asks a participant for, beyond their votes.
 *
 * Each ask surfaces in two places, and one switch governs both:
 *
 * 1. Mid-poll, as a `CheckpointScreen` variant, shown at every tenth vote.
 * 2. On the end page, as a `ThankYouScreen` CTA card.
 *
 * The two surfaces already share one completion flag per ask
 * (`session.emailProvided`, `endCtaShareCompleted`, `endCtaReviewCompleted`),
 * so they are one ask shown twice, not two features. A Host who turns off
 * "Collect Email" means it everywhere, not "not while voting but yes at the
 * end". The keys therefore mirror civicos's `CheckpointVariant` union exactly;
 * adding one on this side alone does nothing.
 *
 * `contribute` has no end-page card (composing lives in the vote bar), and the
 * end page's "Join a Conversation." card has no checkpoint and no switch.
 *
 * INTERIM STORAGE. The on/off state lives in
 * `conversation.metadata.participantAsks` for the same reason demographics
 * does: there is no backend table for it yet. See [demographics.ts](./demographics.ts)
 * and #363.
 *
 * ⚠️ Nothing reads this in civicos yet. `CHECKPOINT_VARIANTS` is a hardcoded
 * array in `contribute/+page.svelte` and `ThankYouScreen` renders all four
 * cards unconditionally, so a Host's choice is stored and shown back to them
 * but does not change the poll until civicos reads its config from the API
 * (#398).
 */

export const ASK_KEYS = ['contribute', 'email', 'feedback', 'share'] as const;

export type AskKey = (typeof ASK_KEYS)[number];

export type AskToggles = Record<AskKey, boolean>;

export interface ParticipantAsk {
	key: AskKey;
	/** Display name, as shown to the Host. */
	name: string;
	/** What the participant sees, paraphrased from the two surfaces' copy. */
	description: string;
	/** Where it appears, for the Host's benefit. */
	surfaces: string;
}

export const PARTICIPANT_ASKS: ParticipantAsk[] = [
	{
		key: 'contribute',
		name: 'Add a Statement',
		description: 'Invites participants to add their own idea to the conversation.',
		surfaces: 'While voting'
	},
	{
		key: 'email',
		name: 'Collect Email',
		description: 'Asks for an email address to follow up with updates and results.',
		surfaces: 'While voting, and at the end'
	},
	{
		key: 'feedback',
		name: 'Ask for Feedback',
		description: 'Asks for a star rating of the voting experience itself.',
		surfaces: 'While voting, and at the end'
	},
	{
		key: 'share',
		name: 'Share with Friends',
		description: 'Prompts participants to pass the poll on to other people.',
		surfaces: 'While voting, and at the end'
	}
];

/**
 * All on. A conversation with no metadata should behave exactly as it does
 * today, and civicos makes all four asks today.
 */
export const DEFAULT_ASK_TOGGLES: AskToggles = {
	contribute: true,
	email: true,
	feedback: true,
	share: true
};

/** Read the toggles out of the untyped `metadata` jsonb, falling back per key. */
export function readAskToggles(metadata: unknown): AskToggles {
	const bag =
		metadata && typeof metadata === 'object'
			? (metadata as Record<string, unknown>).participantAsks
			: null;
	const stored = bag && typeof bag === 'object' ? (bag as Record<string, unknown>) : {};

	return ASK_KEYS.reduce((acc, key) => {
		acc[key] =
			typeof stored[key] === 'boolean' ? (stored[key] as boolean) : DEFAULT_ASK_TOGGLES[key];
		return acc;
	}, {} as AskToggles);
}
