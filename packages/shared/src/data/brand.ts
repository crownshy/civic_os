/**
 * A Brand: the colours, type and shape a Host puts on a Campaign (#428).
 *
 * Named Brand, not Theme, because `Theme` is taken. In this product a Theme is a
 * topic tag on a statement (`ThemeSummary`, `themeControversy`, admin's Theme
 * Explorer, `polis_statement_aux.themes`), and the two would sit two tabs apart
 * in admin. See CONTEXT.md.
 *
 * ## The cascade
 *
 * Four layers, each one overriding the last:
 *
 * 1. **Deployment defaults** — `styles/theme.css`, shipped with the server.
 *    Not represented here: they are the CSS that is already on the page, and a
 *    Brand only emits the variables it actually sets, so anything unset falls
 *    through to them.
 * 2. **Host** — `Organization.metadata.brand`. One Host, one look, across every
 *    Campaign it runs.
 * 3. **Campaign** — `Conversation.metadata.brand`.
 * 4. **Custom properties** — `brand.css`, free-form `--name: value` pairs for
 *    variables this module does not name.
 *
 * ## Why metadata
 *
 * Same reason a Place rides there (ADR 0006): comhairle has no table for this,
 * and `GET /conversation/:idOrSlug` is the only read civicos gets anonymously.
 * `PatchConversationMetadata` and `PatchOrganizationMetadata` both exist today,
 * so the whole cascade is writable without a backend change.
 *
 * `/organizations/:id` is **401 anonymously**, so civicos cannot read layer 2
 * at its source. Admin mirrors it onto the Conversation as `metadata.hostBrand`,
 * the same trick already used for the poll identity and the Host name. Its own
 * top-level key rather than a field on `metadata.org`, because
 * `PatchConversationMetadata` replaces nested objects wholesale and admin
 * rewrites `metadata.org` whenever a Place is saved.
 *
 * ## What is deliberately not here
 *
 * **Gradients.** `--gradient-primary` used to paint `body` on top of
 * `--background`, so a Host could set a background and see nothing change. It
 * is gone, along with every other decorative gradient in civicos (#428). The
 * two that survive are the report's hero and consensus bands, which are a
 * deliberate design element rather than a surface. A Brand does not set them,
 * so those bands stay BLOOM green for every Host.
 *
 * **Free-form CSS.** `brand.css` accepts custom property declarations and
 * nothing else. A Host who can write real rules can write
 * `position:fixed;inset:0;z-index:99` and mount a redressing attack on the
 * participant page, which is the same threat that kept `class` out of the copy
 * sanitizer (ADR 0005). Rules need an iframe or a CSP answer first.
 */

export type BrandTokenKind = 'color' | 'font' | 'length';

export interface BrandTokenDef {
	/** Key inside the stored object, and the form field name. */
	key: string;
	/** The CSS custom property it writes. */
	cssVar: string;
	/** Host-facing name. */
	label: string;
	kind: BrandTokenKind;
	/** How the admin card groups the fields. */
	group: 'surface' | 'accent' | 'type';
}

/**
 * The brandable set: sixteen of the ~50 variables in `theme.css`.
 *
 * The cut is deliberate. Charts, the sidebar, shadows and the gradients are all
 * left out: they are either admin-only surfaces a Host never sees, derived
 * values, or on the way out. Sixteen is a form a Host can finish.
 */
export const BRAND_TOKENS: readonly BrandTokenDef[] = [
	{
		key: 'background',
		cssVar: '--background',
		label: 'Page background',
		kind: 'color',
		group: 'surface'
	},
	{
		key: 'foreground',
		cssVar: '--foreground',
		label: 'Body text',
		kind: 'color',
		group: 'surface'
	},
	{ key: 'card', cssVar: '--card', label: 'Card background', kind: 'color', group: 'surface' },
	{
		key: 'cardForeground',
		cssVar: '--card-foreground',
		label: 'Card text',
		kind: 'color',
		group: 'surface'
	},
	{ key: 'muted', cssVar: '--muted', label: 'Muted background', kind: 'color', group: 'surface' },
	{
		key: 'mutedForeground',
		cssVar: '--muted-foreground',
		label: 'Muted text',
		kind: 'color',
		group: 'surface'
	},
	{ key: 'border', cssVar: '--border', label: 'Borders', kind: 'color', group: 'surface' },

	{ key: 'primary', cssVar: '--primary', label: 'Primary', kind: 'color', group: 'accent' },
	{
		key: 'primaryForeground',
		cssVar: '--primary-foreground',
		label: 'On primary',
		kind: 'color',
		group: 'accent'
	},
	{ key: 'secondary', cssVar: '--secondary', label: 'Secondary', kind: 'color', group: 'accent' },
	{
		key: 'secondaryForeground',
		cssVar: '--secondary-foreground',
		label: 'On secondary',
		kind: 'color',
		group: 'accent'
	},
	{ key: 'accent', cssVar: '--accent', label: 'Accent', kind: 'color', group: 'accent' },
	{
		key: 'accentForeground',
		cssVar: '--accent-foreground',
		label: 'On accent',
		kind: 'color',
		group: 'accent'
	},
	{ key: 'ring', cssVar: '--ring', label: 'Focus ring', kind: 'color', group: 'accent' },

	{ key: 'fontSans', cssVar: '--font-sans', label: 'Body font', kind: 'font', group: 'type' },
	{
		key: 'fontDisplay',
		cssVar: '--font-display',
		label: 'Display font',
		kind: 'font',
		group: 'type'
	},
	{ key: 'radius', cssVar: '--radius', label: 'Corner radius', kind: 'length', group: 'type' }
] as const;

const TOKENS_BY_KEY = new Map(BRAND_TOKENS.map((t) => [t.key, t]));

/** Values a Host set, keyed by `BrandTokenDef.key`. Every key is optional. */
export type BrandTokens = Record<string, string>;

export interface Brand {
	tokens: BrandTokens;
	/** Extra `--name: value` declarations, for variables not in BRAND_TOKENS. */
	css: string | null;
}

export const BRAND_METADATA_KEY = 'brand';
/** Where admin mirrors the Host's Brand so civicos can read it anonymously. */
export const HOST_BRAND_METADATA_KEY = 'hostBrand';

export const EMPTY_BRAND: Brand = { tokens: {}, css: null };

/**
 * Layer 1 of the cascade, written down.
 *
 * `theme.css` is the real source: these are the values a participant sees for
 * each brandable token when no Host and no Campaign has set it. They are not
 * needed to render civicos (the CSS is already on the page there), but admin's
 * Brand preview cannot render without them: admin ships its own palette
 * (`app.css` sets --background white and --primary terracotta), so mock
 * participant screens inside admin inherit the wrong defaults and a preview of
 * an unbranded Campaign would show admin's colours rather than BLOOM's.
 *
 * Duplicated from `theme.css` rather than derived from it, because the
 * stylesheet is not readable at runtime from the other app. `brand.test.ts`
 * parses that file and fails if the two ever disagree, which is what makes the
 * copy safe to keep.
 */
export const PARTICIPANT_DEFAULTS: Brand = {
	tokens: {
		background: '#fff8f1',
		foreground: '#532a0e',
		card: '#ffffff',
		cardForeground: '#532a0e',
		muted: '#fff7e4',
		mutedForeground: '#532a0e',
		border: '#e8eaed',
		primary: '#406b43',
		primaryForeground: '#faeffb',
		secondary: '#a6722e',
		secondaryForeground: '#ffffff',
		accent: '#ffeec5',
		accentForeground: '#af9340',
		ring: '#ffedc4',
		fontSans: "'Hanken Grotesk', sans-serif",
		fontDisplay: "'Geom', 'Hanken Grotesk', sans-serif",
		radius: '0.5rem'
	},
	css: null
};

/**
 * The six swatches on admin's Setup card. A preset is a Brand fragment, not a
 * separate concept: picking one writes these tokens into the Campaign's Brand,
 * so the Brand card's fields and the swatch row are two editors of the same
 * values and cannot disagree.
 *
 * ## Where the colours come from
 *
 * The six primaries are Tailwind v3 rungs exactly (`orange-700`, `blue-600`,
 * `green-600`, `purple-600`, `pink-600`, `cyan-600`), so the design sampled that
 * palette. The other values are taken from the same six families at `50`, `100`
 * and `800` rather than picked by eye, which is what keeps a scheme coherent
 * without anyone having to design five more colours per swatch.
 *
 * `50` for the page and `100` for `--muted`, keeping the direction the defaults
 * already had (`--background` #fff8f1 is lighter than `--muted` #fff7e4).
 * `--muted` is a report surface only: the opinion-group rows, the summary
 * callout and the demographics placeholder. The voting column used to be the
 * one place it mattered, and that moved to `--background` when the contribute
 * screens went flat (ADR 0010).
 *
 * `800` for the secondary because `--secondary` is mostly *text* in civicos
 * (`text-secondary` and its opacity variants), and secondarily a solid button
 * with `--secondary-foreground` white on it. It has to be dark in both
 * directions. Every 800 here clears 7:1 against white and more against its own
 * 50, where the default `#a6722e` managed 3.7:1 and failed.
 *
 * ## What a preset still does not set
 *
 * `--foreground` and `--accent`, which stay BLOOM's warm browns. On the blue and
 * purple schemes that reads as brown body copy on a cool tint: high contrast,
 * wrong hue. Adding them is a design decision about how far a swatch should
 * reach, tracked on #428, not something to guess at here.
 *
 * The contribute screens used to hardcode most of their colour rather than
 * tokenise it, which no Brand could move whatever the allowlist said. That is
 * mostly paid off: the Unsure button is `bg-secondary/20`, the compose strip is
 * `--secondary` mixed 55/45 with black (dark under every preset, since each one
 * takes its secondary from Tailwind 800), its pill is `--card` carrying
 * `--card-foreground`, and `text-yellow-950` is `--foreground`. What is left is
 * `bg-[#FFEDD3]` on the header, `--destructive` on Disagree (red in every
 * scheme, and not in the allowlist), the brown drop shadows, and the smiley
 * asset, which is an SVG and cannot read a variable at all.
 *
 * White on the primaries clears 4.5:1 on terracotta, blue, purple and pink; on
 * green and teal it lands near 3:1, which passes for large text only. The
 * primaries are the design's, so this records the problem rather than quietly
 * darkening two of them.
 */
export interface BrandPreset {
	id: string;
	label: string;
	tokens: BrandTokens;
}

const preset = (
	id: string,
	label: string,
	/** Tailwind 600/700: the swatch itself. */
	primary: string,
	/** Tailwind 50: the page tint under it. */
	background: string,
	/** Tailwind 100: the report's muted surfaces. */
	muted: string,
	/** Tailwind 800: body text and the solid secondary button. */
	secondary: string
): BrandPreset => ({
	id,
	label,
	tokens: {
		primary,
		ring: primary,
		primaryForeground: '#ffffff',
		background,
		muted,
		secondary,
		secondaryForeground: '#ffffff'
	}
});

export const BRAND_PRESETS: readonly BrandPreset[] = [
	preset('terracotta', 'Terracotta', '#c2410c', '#fff7ed', '#ffedd5', '#9a3412'),
	preset('blue', 'Blue', '#2563eb', '#eff6ff', '#dbeafe', '#1e40af'),
	preset('green', 'Green', '#16a34a', '#f0fdf4', '#dcfce7', '#166534'),
	preset('purple', 'Purple', '#9333ea', '#faf5ff', '#f3e8ff', '#6b21a8'),
	preset('pink', 'Pink', '#db2777', '#fdf2f8', '#fce7f3', '#9d174d'),
	preset('teal', 'Teal', '#0891b2', '#ecfeff', '#cffafe', '#155e75')
];

/**
 * Which swatch a Brand is currently on, or null when its primary is a colour no
 * preset offers. A Campaign that has never been branded lands here too, and the
 * row shows nothing selected: no scheme has been picked, and pretending one has
 * is what made the old picker read as broken.
 */
export function presetFor(brand: Brand | null | undefined): BrandPreset | null {
	const primary = brand?.tokens.primary?.toLowerCase();
	if (!primary) return null;

	return BRAND_PRESETS.find((p) => p.tokens.primary === primary) ?? null;
}

/**
 * Every value ends up inside a declaration in a `<style>` element, so a value
 * carrying `;`, `}` or `<` would let a Host write rules rather than set a
 * variable. Each pattern is whole-string anchored and none of them admits those
 * characters, which is what makes the emitted CSS safe by construction rather
 * than by escaping.
 */
const COLOR_FUNCTIONS = 'rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color';
const PATTERNS: Record<BrandTokenKind, RegExp> = {
	// #abc, #aabbcc, #aabbccdd, oklch(0.7 0.1 250 / 50%), or a named colour.
	// `var(…)` is not allowed: the parentheses are, the nested `(` is not.
	color: new RegExp(`^(#[0-9a-f]{3,8}|(?:${COLOR_FUNCTIONS})\\([0-9a-z.%,/ +-]*\\)|[a-z]+)$`, 'i'),
	// A font-family list. Quotes are fine inside a declaration value.
	font: /^[a-z0-9 ,'"_-]{1,200}$/i,
	length: /^-?(?:[0-9]*\.)?[0-9]+(?:px|rem|em|%)$/
};

/** Whether a value may be written as this kind of token. */
export function isValidBrandValue(kind: BrandTokenKind, value: string): boolean {
	return PATTERNS[kind].test(value.trim());
}

/**
 * Read a Brand out of a metadata blob. `metadata` is `z.unknown()` in the
 * generated client and hand-editable in the backend, so every field is checked
 * rather than asserted: an unknown token key, a malformed value or a wrong type
 * is dropped and the layer below shows through. A Brand that fails to parse
 * degrades to the deployment default, never to a broken page.
 */
export function readBrand(metadata: unknown, key: string = BRAND_METADATA_KEY): Brand | null {
	if (typeof metadata !== 'object' || metadata === null) return null;

	const value = (metadata as Record<string, unknown>)[key];
	if (typeof value !== 'object' || value === null) return null;

	const { tokens, css } = value as Record<string, unknown>;

	const clean: BrandTokens = {};
	if (typeof tokens === 'object' && tokens !== null) {
		for (const [k, v] of Object.entries(tokens as Record<string, unknown>)) {
			const def = TOKENS_BY_KEY.get(k);
			if (!def || typeof v !== 'string') continue;
			if (isValidBrandValue(def.kind, v)) clean[k] = v.trim();
		}
	}

	const extra = typeof css === 'string' ? sanitizeBrandCss(css) : null;
	if (Object.keys(clean).length === 0 && !extra) return null;

	return { tokens: clean, css: extra };
}

/** The Host's Brand, mirrored onto the Conversation because `/organizations` is 401. */
export const readHostBrand = (metadata: unknown): Brand | null =>
	readBrand(metadata, HOST_BRAND_METADATA_KEY);

/**
 * Keep only custom property declarations.
 *
 * Not a CSS parser and not trying to be one. It splits on `;`, keeps the lines
 * shaped `--name: value` whose value is a plain token, and drops everything
 * else. A selector, an at-rule, a `url(`, a `</style>` and a stray brace all
 * fail that shape, so they come out rather than being escaped.
 *
 * The cost is that a Host cannot write a rule. That is the point: see the
 * module header and ADR 0005.
 */
export function sanitizeBrandCss(css: string | null | undefined): string | null {
	if (!css) return null;

	const kept = css
		.split(';')
		.map((line) => line.trim())
		.map((line) => /^(--[a-z0-9-]+)\s*:\s*([^;{}<>()\\]+)$/i.exec(line))
		.filter((m): m is RegExpExecArray => m !== null)
		.map((m) => `${m[1]}: ${m[2].trim()}`);

	return kept.length ? kept.join(';\n\t') : null;
}

/**
 * Flatten the cascade. Later layers win per token; the custom declarations
 * concatenate in order, so a Campaign's `--x` overrides its Host's by coming
 * after it in the same block.
 */
export function resolveBrand(...layers: (Brand | null | undefined)[]): Brand {
	const tokens: BrandTokens = {};
	const css: string[] = [];

	for (const layer of layers) {
		if (!layer) continue;
		Object.assign(tokens, layer.tokens);
		if (layer.css) css.push(layer.css);
	}

	return { tokens, css: css.length ? css.join(';\n\t') : null };
}

/** Whether this Brand would change anything if it were emitted. */
export const isEmptyBrand = (brand: Brand): boolean =>
	Object.keys(brand.tokens).length === 0 && !brand.css;

/**
 * The `<style>` body for a resolved Brand, or an empty string when it sets
 * nothing.
 *
 * `:root` rather than a wrapper class because dialogs and overlays portal to
 * `document.body`, outside whatever element the Campaign layout owns.
 *
 * Doubled to `:root:root` so the block does not depend on where SvelteKit
 * happens to place `<svelte:head>` content relative to the stylesheet links.
 * At (0,2,0) it also outranks `theme.css`'s `.dark`, which is currently dead in
 * civicos: nothing there ever sets the class. A Brand that has to survive a
 * real dark mode needs a dark half of its own, which is an open question, not
 * something this specificity should decide by accident.
 *
 */
export function brandCss(brand: Brand): string {
	const declarations = brandDeclarations(brand);
	if (declarations.length === 0) return '';

	return `:root:root {\n\t${declarations.join(';\n\t')};\n}`;
}

/**
 * The same declarations as a `style` attribute value, for painting a Brand onto
 * one element rather than the document.
 *
 * Admin's Brand preview is the caller: it renders mock participant screens
 * inside a phone frame, and a `:root` block would repaint admin itself. Setting
 * the variables on the frame instead keeps them to their subtree, and every
 * token resolves at the element that uses it, so the mocks pick them up the
 * same way civicos does.
 *
 * Safe in an attribute for the same reason `brandCss` is safe in a `<style>`:
 * no value that survives `isValidBrandValue` or `sanitizeBrandCss` can carry a
 * quote, a `;` or a `<`.
 */
export function brandStyle(brand: Brand): string {
	return brandDeclarations(brand).join('; ');
}

function brandDeclarations(brand: Brand): string[] {
	const declarations = Object.entries(brand.tokens)
		.map(([key, value]) => {
			const def = TOKENS_BY_KEY.get(key);
			return def && isValidBrandValue(def.kind, value) ? `${def.cssVar}: ${value}` : null;
		})
		.filter((d): d is string => d !== null);

	// Sanitized again rather than trusted. `readBrand` already did it, but this
	// is the render boundary: the layout wraps this output in a `<style>` element
	// through `{@html}`, so a Brand built by hand or reached some other way must
	// not be able to carry a `<` out of here (ADR 0005).
	const extra = sanitizeBrandCss(brand.css);
	if (extra) declarations.push(extra);

	return declarations;
}
