import {
	DEMOGRAPHIC_CATEGORIES,
	type CustomDemographicCategory,
	type DemographicToggles
} from '@civicos/shared/data/demographics';

export interface PreviewCategory {
	name: string;
	/** An option from the category, so one row can be shown answered. */
	answer: string;
}

/**
 * The About You rows this Campaign would show, in Setup's order.
 *
 * Built from the same toggles the Demographics card writes, so switching a
 * category off empties its row in the preview the way it does on the real
 * screen. Custom categories are included because Setup lets a Host add them,
 * even though civicos cannot ask them yet (#364).
 */
export function previewCategories(
	toggles: DemographicToggles,
	custom: CustomDemographicCategory[]
): PreviewCategory[] {
	const defaults = DEMOGRAPHIC_CATEGORIES.filter((c) => toggles[c.key]).map((c) => ({
		name: c.name,
		answer: c.options[0] ?? ''
	}));

	const added = custom
		.filter((c) => c.enabled)
		.map((c) => ({ name: c.displayName, answer: c.options[0] ?? '' }));

	return [...defaults, ...added];
}
