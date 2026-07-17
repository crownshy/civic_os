/**
 * Typed view over a conversation's free-form `metadata` JSON blob.
 *
 * The column is an owner-writable JSON object (see comhairle's
 * `PatchConversationMetadata`), so we parse leniently: unknown top-level keys are
 * preserved and ignored, and a missing `themes` key yields an empty dictionary.
 * Today the only structured key we read is the theme dictionary — a map keyed by
 * theme name — but more keys may be added later.
 */
import { z } from 'zod';

/** One entry in the theme dictionary. Keyed by theme name in the parent map. */
export const ThemeEntrySchema = z.object({
	description: z.string().default('')
});

export const ConversationMetadataSchema = z
	.object({
		themes: z.record(z.string(), ThemeEntrySchema).default({})
	})
	// Tolerate (and keep) future metadata keys we don't model yet.
	.passthrough();

export type ConversationMetadata = z.infer<typeof ConversationMetadataSchema>;

/** The canonical dictionary shape the picker consumes: name + description. */
export interface ThemeDefinition {
	name: string;
	description: string;
}

export interface ParsedMetadata {
	/** Theme dictionary keyed by name; empty if metadata is absent/malformed. */
	themes: Record<string, { description: string }>;
	/** Human-readable parse error, or null when parsing succeeded. */
	error: string | null;
}

/**
 * Parse a raw `metadata` value into a typed object with graceful error handling.
 *
 * Never throws: on a schema mismatch it returns an empty dictionary plus a
 * human-readable `error` string, so the caller (a page load / component) can
 * still render and optionally surface the problem instead of crashing.
 */
export function parseMetadata(raw: unknown): ParsedMetadata {
	const result = ConversationMetadataSchema.safeParse(raw ?? {});
	if (!result.success) {
		return {
			themes: {},
			error: `Conversation metadata is malformed: ${result.error.issues
				.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
				.join('; ')}`
		};
	}
	return { themes: result.data.themes, error: null };
}

/** Flatten the dictionary map into a name-sorted `ThemeDefinition[]` for the picker. */
export function toThemeDefinitions(
	themes: Record<string, { description: string }>
): ThemeDefinition[] {
	return Object.entries(themes)
		.map(([name, { description }]) => ({ name, description }))
		.sort((a, b) => a.name.localeCompare(b.name));
}
