/**
 * Which Polis conversation a workflow step is wired to.
 *
 * Comhairle exposes two tool configs on a step and they do not always agree:
 * `toolConfig`, and `previewToolConfig`. A step created through `tool_setup`
 * comes back with only the preview one, and `toolConfig` stays null for a long
 * time after, through going live and beyond. Reading `toolConfig` alone
 * therefore finds no poll on any Campaign created in admin, which is why those
 * Campaigns had no Key Question, no mirrored `metadata.poll`, and sent their
 * participants to whichever poll `regions.ts` guessed from their zip.
 *
 * `toolConfig` first, `previewToolConfig` behind it. That is comhairle's own
 * resolution order, not an assumption: `PUT /tools/polis/config` returns the
 * poll it reached through the server-side admin session, and it answers with the
 * `toolConfig` id on a step that has one and the `previewToolConfig` id on a
 * step that does not. Verified against a local comhairle on one step of each
 * kind.
 *
 * The order matters in exactly the case `scripts/seed-dev.sh` warns about: once
 * a step has a `toolConfig`, its `previewToolConfig` holds a *different*,
 * unrelated poll. Preferring the preview would split admin moderation and the
 * participant embed across two Polis conversations.
 */

/** A Polis step's resolved config. Field names follow comhairle's wire shape. */
export interface PolisStepConfig {
	/** `poll_id`: the Polis conversation id. */
	pollId: string;
	/** `server_url`, normalised to an absolute origin. Null when absent. */
	serverUrl: string | null;
	/** `topic`: the Key Question. Frequently null, even on a step that has one. */
	topic: string | null;
}

/** Anything shaped like a workflow step. Both fields are `unknown` on the wire. */
interface StepLike {
	toolConfig?: unknown;
	previewToolConfig?: unknown;
}

/**
 * The Polis config for one step, or null when it is not a Polis step.
 *
 * Doubles as the "is this the Polis step?" predicate when picking one out of a
 * workflow's steps, so the search and the read cannot disagree about which step
 * counts.
 */
export function polisConfigFor(step: StepLike | null | undefined): PolisStepConfig | null {
	return readPolisConfig(step?.toolConfig) ?? readPolisConfig(step?.previewToolConfig);
}

/**
 * Narrow one tool config to a Polis one. Every field is checked rather than
 * asserted: the generated client types these as a union it cannot discriminate
 * at this depth, and a step may carry any tool's config.
 */
function readPolisConfig(config: unknown): PolisStepConfig | null {
	if (typeof config !== 'object' || config === null) return null;

	const { type, poll_id: pollId, server_url: serverUrl, topic } = config as Record<string, unknown>;
	if (type !== 'polis') return null;
	if (typeof pollId !== 'string' || pollId.trim() === '') return null;

	return {
		pollId: pollId.trim(),
		serverUrl: absoluteOrigin(serverUrl),
		topic: typeof topic === 'string' && topic.trim() !== '' ? topic.trim() : null
	};
}

/**
 * Comhairle reports `server_url` as a bare host (`polis.comhairle.scot`), and
 * civicos builds its Polis request URLs by concatenation. Mirrored as-is, the
 * embed asks the participant app's own origin for
 * `/<org>/conversations/<slug>/polis.comhairle.scot/api/v3/...` and gets a 404,
 * because a scheme-less string is a relative path. So the scheme goes on here,
 * where the value enters our side of the wire, rather than at each use.
 */
function absoluteOrigin(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const host = value.trim().replace(/\/+$/, '');
	if (host === '') return null;

	return /^https?:\/\//.test(host) ? host : `https://${host}`;
}
