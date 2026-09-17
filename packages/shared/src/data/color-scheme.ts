/**
 * A Color Scheme: the one colour a Host picks for a Campaign's participant pages.
 *
 * Named Color Scheme, not Theme, because a Theme in this product is a topic tag
 * on a statement. See CONTEXT.md.
 *
 * This replaced the Brand from #428 (17 editable tokens, free-form custom
 * properties, a Host layer mirrored onto every Campaign). The design settled on a
 * short list of named schemes instead, and a scheme reaches only the accent: the
 * page, body text, Disagree and END look the same in every scheme. See ADR 0012.
 *
 * Stored as an id on `Conversation.metadata.colorScheme`, the same interim home
 * as a Place (ADR 0006). The hexes live here, never in metadata, so nothing a
 * Host or a hand edit can write ends up inside a declaration.
 */

export interface ColorScheme {
	id: string;
	label: string;
	/** Solid fills: buttons, chips, the compose strip, the footer. White sits on it. */
	primary: string;
	/**
	 * The same hue, darker. Mostly text and thin fills in civicos (progress bar,
	 * labels, the Header dot), so it has to clear 4.5:1 on white.
	 */
	secondary: string;
}

export const COLOR_SCHEME_METADATA_KEY = 'colorScheme';

/**
 * Green is first and is what `civicos/lib/styles/theme.css` already ships, so a
 * Campaign that never picked a scheme looks exactly like one that picked Green.
 * `color-scheme.test.ts` holds the two together.
 *
 * Slate and Plum are read off the design screenshots rather than Figma, so treat
 * their hexes as provisional. The last five are the Tailwind 600/700 swatches the
 * Setup card offered before, with their 800 as the secondary.
 */
export const COLOR_SCHEMES: readonly ColorScheme[] = [
	{ id: 'green', label: 'Green', primary: '#406b43', secondary: '#345136' },
	{ id: 'slate', label: 'Slate', primary: '#4a4f7c', secondary: '#363a5e' },
	{ id: 'plum', label: 'Plum', primary: '#6b4570', secondary: '#4e3252' },
	{ id: 'terracotta', label: 'Terracotta', primary: '#c2410c', secondary: '#9a3412' },
	{ id: 'blue', label: 'Blue', primary: '#2563eb', secondary: '#1e40af' },
	{ id: 'purple', label: 'Purple', primary: '#9333ea', secondary: '#6b21a8' },
	{ id: 'pink', label: 'Pink', primary: '#db2777', secondary: '#9d174d' },
	{ id: 'teal', label: 'Teal', primary: '#0891b2', secondary: '#155e75' }
];

export const DEFAULT_COLOR_SCHEME = COLOR_SCHEMES[0];

/** The scheme stored on a Conversation, or null when none is, or the id is unknown. */
export function readColorScheme(metadata: unknown): ColorScheme | null {
	if (typeof metadata !== 'object' || metadata === null) return null;
	const id = (metadata as Record<string, unknown>)[COLOR_SCHEME_METADATA_KEY];

	return COLOR_SCHEMES.find((s) => s.id === id) ?? null;
}

/** Declarations for a scheme, for a `style` attribute or a rule body. */
export const colorSchemeDeclarations = (scheme: ColorScheme): string =>
	`--primary: ${scheme.primary}; --ring: ${scheme.primary}; --secondary: ${scheme.secondary}`;

/**
 * A `:root` block for a scheme.
 *
 * `:root` because dialogs portal to `document.body`, outside anything the
 * Campaign layout owns. Doubled because `theme.css` emits its own `:root` after
 * `<svelte:head>` content, and equal specificity would lose on source order.
 */
export const colorSchemeCss = (scheme: ColorScheme): string =>
	`:root:root { ${colorSchemeDeclarations(scheme)}; }`;
