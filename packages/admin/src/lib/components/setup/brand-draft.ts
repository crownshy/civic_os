import {
	BRAND_TOKENS,
	isValidBrandValue,
	sanitizeBrandCss,
	type Brand,
	type BrandTokens
} from '@civicos/shared/data/brand';

/**
 * A Brand mid-edit.
 *
 * Differs from `Brand` in one place: `css` is bound to a textarea, so an empty
 * one is `''` rather than `null`. Everything else is the stored shape, which is
 * what lets the preview render a draft without waiting for a save.
 */
export interface BrandDraft {
	tokens: BrandTokens;
	css: string;
}

export const toDraft = (brand: Brand): BrandDraft => ({
	tokens: { ...brand.tokens },
	css: brand.css ?? ''
});

/** What a save would store. Sanitizing here is what the preview shows. */
export const fromDraft = (draft: BrandDraft): Brand => ({
	tokens: { ...draft.tokens },
	css: sanitizeBrandCss(draft.css)
});

/** Token keys whose current value is not something that kind can hold. */
export const invalidTokens = (draft: BrandDraft): string[] =>
	BRAND_TOKENS.filter((t) => {
		const value = draft.tokens[t.key];
		return !!value && !isValidBrandValue(t.kind, value);
	}).map((t) => t.key);

/** Blank clears the token rather than storing an empty string, so the layer below shows through. */
export function withToken(draft: BrandDraft, key: string, value: string): BrandDraft {
	const tokens: BrandTokens = { ...draft.tokens };
	if (value.trim() === '') delete tokens[key];
	else tokens[key] = value;
	return { ...draft, tokens };
}
