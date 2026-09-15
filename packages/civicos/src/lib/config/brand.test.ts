import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	BRAND_PRESETS,
	BRAND_TOKENS,
	brandCss,
	isValidBrandValue,
	PARTICIPANT_DEFAULTS,
	readBrand,
	readHostBrand,
	presetFor,
	resolveBrand,
	sanitizeBrandCss
} from '@civicos/shared/data/brand';

describe('readBrand', () => {
	it('reads a well-formed brand off the metadata', () => {
		expect(readBrand({ brand: { tokens: { primary: '#406b43' }, css: null } })).toEqual({
			tokens: { primary: '#406b43' },
			css: null
		});
	});

	it('drops token keys that are not brandable', () => {
		const brand = readBrand({ brand: { tokens: { primary: '#fff', sidebar: '#000' } } });
		expect(brand?.tokens).toEqual({ primary: '#fff' });
	});

	it('drops a value that would break out of its declaration', () => {
		const brand = readBrand({
			brand: { tokens: { primary: 'red; } html { display: none } .x {' } }
		});
		expect(brand).toBeNull();
	});

	it('reads nothing from an absent, malformed or empty brand', () => {
		expect(readBrand(null)).toBeNull();
		expect(readBrand({})).toBeNull();
		expect(readBrand({ brand: 'blue' })).toBeNull();
		expect(readBrand({ brand: { tokens: {} } })).toBeNull();
	});

	it('reads the mirrored Host layer from its own key', () => {
		const metadata = { hostBrand: { tokens: { primary: '#111' } }, brand: { tokens: {} } };
		expect(readHostBrand(metadata)?.tokens).toEqual({ primary: '#111' });
	});
});

describe('isValidBrandValue', () => {
	it('accepts the colour forms a host would paste', () => {
		for (const value of ['#fff', '#406b43', '#406b43cc', 'oklch(0.7 0.1 250)', 'transparent']) {
			expect(isValidBrandValue('color', value)).toBe(true);
		}
	});

	it('rejects anything carrying a declaration or rule boundary', () => {
		for (const value of ['red;', 'red}', 'url(//evil.test/x.png)', 'var(--x)', '<script>']) {
			expect(isValidBrandValue('color', value)).toBe(false);
		}
	});

	it('holds lengths to a unit it can render', () => {
		expect(isValidBrandValue('length', '0.5rem')).toBe(true);
		expect(isValidBrandValue('length', '12px')).toBe(true);
		expect(isValidBrandValue('length', 'calc(1rem + 2px)')).toBe(false);
	});
});

describe('sanitizeBrandCss', () => {
	it('keeps custom property declarations', () => {
		expect(sanitizeBrandCss('--shell-border: #876449; --tracking-display: -0.01em')).toBe(
			'--shell-border: #876449;\n\t--tracking-display: -0.01em'
		);
	});

	it('drops rules, at-rules and anything that could cover the page', () => {
		expect(sanitizeBrandCss('body { position: fixed; inset: 0 }')).toBeNull();
		expect(sanitizeBrandCss('@import url("//evil.test/x.css")')).toBeNull();
		expect(sanitizeBrandCss('--a: red</style><script>alert(1)</script>')).toBeNull();
	});

	it('keeps the declarations out of a mixed blob and drops the rest', () => {
		expect(sanitizeBrandCss('--a: red; body { color: blue }')).toBe('--a: red');
	});
});

describe('resolveBrand', () => {
	it('lets a later layer win per token', () => {
		const host = { tokens: { primary: '#111', accent: '#222' }, css: null };
		const campaign = { tokens: { primary: '#333' }, css: null };

		expect(resolveBrand(host, campaign).tokens).toEqual({ primary: '#333', accent: '#222' });
	});

	it('ignores absent layers', () => {
		expect(
			resolveBrand(null, undefined, { tokens: { primary: '#333' }, css: null }).tokens
		).toEqual({ primary: '#333' });
	});
});

describe('brandCss', () => {
	it('emits only the variables the brand set', () => {
		const css = brandCss({ tokens: { primary: '#406b43' }, css: null });
		expect(css).toBe(':root:root {\n\t--primary: #406b43;\n}');
	});

	it('emits a background as the only declaration it needs to', () => {
		// It used to also emit `--gradient-primary: none`, because layout.css
		// painted body with a gradient image over the colour. The gradient is gone
		// (#428), so the token stands on its own.
		expect(brandCss({ tokens: { background: '#ffffff' }, css: null })).toBe(
			':root:root {\n\t--background: #ffffff;\n}'
		);
	});

	it('emits nothing for a brand that sets nothing', () => {
		expect(brandCss({ tokens: {}, css: null })).toBe('');
	});

	it('cannot emit a character that would close the style element', () => {
		// The layout injects `<style>${brandCss(brand)}</style>` through {@html},
		// so a value carrying `</style>` would break out into markup. Nothing
		// reaches the emitter with a `<` in it, from either half of a Brand.
		const hostile = {
			tokens: { primary: '#fff</style><script>alert(1)</script>' },
			css: '--x: red</style><script>alert(1)</script>'
		};

		expect(brandCss(readBrand({ brand: hostile }) ?? { tokens: {}, css: null })).toBe('');
		expect(brandCss(hostile)).not.toContain('<');
	});
});

describe('presetFor', () => {
	it('matches a brand to the swatch it is on', () => {
		const blue = BRAND_PRESETS.find((p) => p.id === 'blue')!;
		expect(presetFor({ tokens: { primary: blue.tokens.primary }, css: null })?.id).toBe('blue');
	});

	it('matches regardless of the case the hex was typed in', () => {
		expect(presetFor({ tokens: { primary: '#2563EB' }, css: null })?.id).toBe('blue');
	});

	it('selects nothing for a colour no preset offers', () => {
		// A Campaign nobody has branded lands here, and the row shows no ring.
		// The picker used to default to index 0, which is why it always read
		// orange no matter what had been saved.
		expect(presetFor({ tokens: { primary: '#123456' }, css: null })).toBeNull();
		expect(presetFor({ tokens: {}, css: null })).toBeNull();
		expect(presetFor(null)).toBeNull();
	});

	it('offers only values a brand can actually store', () => {
		for (const p of BRAND_PRESETS) {
			expect(readBrand({ brand: { tokens: p.tokens } })?.tokens).toEqual(p.tokens);
		}
	});

	it('carries the page and voting surfaces, not just an accent colour', () => {
		// A swatch that only set --primary repainted one button and left the page
		// BLOOM's cream, which read as the picker not working. --muted is in here
		// because it paints the whole voting column on the contribute screen.
		for (const p of BRAND_PRESETS) {
			expect(Object.keys(p.tokens).sort()).toEqual([
				'background',
				'muted',
				'primary',
				'primaryForeground',
				'ring',
				'secondary',
				'secondaryForeground'
			]);
		}
	});

	it('keeps white legible on every solid a preset fills', () => {
		// --secondary is body text and a white-on-solid button, so 4.5:1 is the
		// bar it has to clear, in a way the #a6722e default never did.
		const luminance = (hex: string) => {
			const channel = (i: number) => {
				const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
				return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
			};
			return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
		};
		const onWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

		for (const p of BRAND_PRESETS) {
			expect(onWhite(p.tokens.secondary)).toBeGreaterThan(4.5);
		}
	});
});

describe('PARTICIPANT_DEFAULTS', () => {
	// The values are hand-copied into brand.ts because admin cannot read this
	// stylesheet at runtime, and admin's Brand preview needs layer 1 to render an
	// unbranded Campaign as a participant would see it. This is the check that
	// keeps the copy from going stale: theme.css is the source, and a change
	// there fails here rather than quietly showing the wrong default in admin.
	const root = readFileSync(
		fileURLToPath(new URL('../styles/theme.css', import.meta.url)),
		'utf-8'
	).slice(0);

	const rootBlock = root.slice(root.indexOf(':root {'), root.indexOf('}'));
	const declared = new Map(
		[...rootBlock.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((m) => [m[1], m[2].trim()])
	);

	it.each(BRAND_TOKENS.map((t) => [t.key, t.cssVar] as const))(
		'matches theme.css for %s',
		(key, cssVar) => {
			expect(PARTICIPANT_DEFAULTS.tokens[key]).toBe(declared.get(cssVar));
		}
	);

	it('covers every brandable token', () => {
		expect(Object.keys(PARTICIPANT_DEFAULTS.tokens).sort()).toEqual(
			BRAND_TOKENS.map((t) => t.key).sort()
		);
	});
});
