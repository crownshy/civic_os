import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	COLOR_SCHEMES,
	DEFAULT_COLOR_SCHEME,
	colorSchemeCss,
	readColorScheme
} from '@civicos/shared/data/color-scheme';

describe('readColorScheme', () => {
	it('reads a known id off the metadata', () => {
		expect(readColorScheme({ colorScheme: 'slate' })?.id).toBe('slate');
	});

	it('reads nothing from an absent, unknown or malformed value', () => {
		expect(readColorScheme(null)).toBeNull();
		expect(readColorScheme({})).toBeNull();
		expect(readColorScheme({ colorScheme: 'mauve' })).toBeNull();
		expect(readColorScheme({ colorScheme: { primary: '#fff' } })).toBeNull();
	});
});

describe('colorSchemeCss', () => {
	it('sets the accent and nothing else', () => {
		const slate = COLOR_SCHEMES.find((s) => s.id === 'slate')!;
		expect(colorSchemeCss(slate)).toBe(
			':root:root { --primary: #4a4f7c; --ring: #4a4f7c; --secondary: #363a5e; }'
		);
	});
});

describe('COLOR_SCHEMES', () => {
	it('has unique ids', () => {
		expect(new Set(COLOR_SCHEMES.map((s) => s.id)).size).toBe(COLOR_SCHEMES.length);
	});

	it('keeps every secondary legible as text on white', () => {
		// `--secondary` is labels and the progress bar in civicos, so it needs 4.5:1.
		const luminance = (hex: string) => {
			const channel = (i: number) => {
				const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
				return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
			};
			return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
		};

		for (const s of COLOR_SCHEMES) {
			expect(1.05 / (luminance(s.secondary) + 0.05)).toBeGreaterThan(4.5);
		}
	});
});

describe('DEFAULT_COLOR_SCHEME', () => {
	// A Campaign with no scheme emits nothing and gets theme.css, so theme.css has
	// to be the default scheme or "never picked" and "picked Green" would differ.
	const css = readFileSync(fileURLToPath(new URL('../styles/theme.css', import.meta.url)), 'utf-8');
	const root = css.slice(css.indexOf(':root {'), css.indexOf('}'));
	const declared = (name: string) =>
		new RegExp(`(?<![\\w-])${name}\\s*:\\s*([^;]+);`).exec(root)?.[1].trim();

	it('matches theme.css', () => {
		expect(declared('--primary')).toBe(DEFAULT_COLOR_SCHEME.primary);
		expect(declared('--ring')).toBe(DEFAULT_COLOR_SCHEME.primary);
		expect(declared('--secondary')).toBe(DEFAULT_COLOR_SCHEME.secondary);
	});
});
