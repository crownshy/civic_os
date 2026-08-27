/**
 * Checkpoint CTAs a Host can switch on or off.
 *
 * civicos pauses the swipe flow every 10 votes and shows one of these screens
 * (`contribute/CheckpointScreen.svelte`), consuming the list in order and
 * rolling past any whose action the participant already completed. The keys
 * here mirror that component's `CheckpointVariant` union exactly; adding one
 * on this side alone does nothing.
 *
 * INTERIM STORAGE. The on/off state lives in `conversation.metadata.checkpoints`
 * for the same reason demographics does: there is no backend table for it yet.
 * See [demographics.ts](./demographics.ts) and #363.
 *
 * ⚠️ Nothing reads this in civicos yet. `CHECKPOINT_VARIANTS` is a hardcoded
 * array in `contribute/+page.svelte`, so a Host's choice is stored and shown
 * back to them but does not change the poll until civicos reads its config from
 * the API (#398).
 */

export const CHECKPOINT_KEYS = ['contribute', 'email', 'feedback', 'share'] as const;

export type CheckpointKey = (typeof CHECKPOINT_KEYS)[number];

export type CheckpointToggles = Record<CheckpointKey, boolean>;

export interface CheckpointCta {
	key: CheckpointKey;
	/** Display name, as shown to the Host. */
	name: string;
	/** What the participant sees, paraphrased from CheckpointScreen's copy. */
	description: string;
	/** Label on the screen's primary button. */
	action: string;
}

export const CHECKPOINT_CTAS: CheckpointCta[] = [
	{
		key: 'contribute',
		name: 'Add a Statement',
		description: 'Invites participants to add their own idea to the conversation.',
		action: 'ADD STATEMENT'
	},
	{
		key: 'email',
		name: 'Collect Email',
		description: 'Asks for an email address to follow up with updates and results.',
		action: 'ENTER EMAIL'
	},
	{
		key: 'feedback',
		name: 'Ask for Feedback',
		description: 'Asks for a star rating of the voting experience itself.',
		action: 'GIVE FEEDBACK'
	},
	{
		key: 'share',
		name: 'Share with Friends',
		description: 'Prompts participants to pass the poll on to other people.',
		action: 'SHARE'
	}
];

/**
 * All on. A conversation with no metadata should behave exactly as it does
 * today, and civicos shows all four checkpoints today.
 */
export const DEFAULT_CHECKPOINT_TOGGLES: CheckpointToggles = {
	contribute: true,
	email: true,
	feedback: true,
	share: true
};

/** Read the toggles out of the untyped `metadata` jsonb, falling back per key. */
export function readCheckpointToggles(metadata: unknown): CheckpointToggles {
	const bag =
		metadata && typeof metadata === 'object'
			? (metadata as Record<string, unknown>).checkpoints
			: null;
	const stored = bag && typeof bag === 'object' ? (bag as Record<string, unknown>) : {};

	return CHECKPOINT_KEYS.reduce((acc, key) => {
		acc[key] =
			typeof stored[key] === 'boolean' ? (stored[key] as boolean) : DEFAULT_CHECKPOINT_TOGGLES[key];
		return acc;
	}, {} as CheckpointToggles);
}
