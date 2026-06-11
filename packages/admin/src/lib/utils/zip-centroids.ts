/**
 * Lightweight zipcode prefix → approximate centroid lookup.
 *
 * Used by the participants map to plot zip-level participation without
 * requiring a full zip→latlng dataset (which would bloat the bundle).
 * Centroid is matched on the longest prefix available — falls back to a
 * generic US center if no prefix matches.
 *
 * Coordinates are state-region centroids, accurate enough for a city-level
 * map view. Replace with a real zip→latlng dataset when needed.
 */

const PREFIX_CENTROIDS: Array<[string, [number, number]]> = [
	// Utah
	['840', [-111.89, 40.76]], // SLC metro
	['841', [-111.89, 40.76]], // SLC
	['843', [-112.0, 41.22]], // Ogden
	['844', [-111.83, 41.74]], // Logan / Cache
	['846', [-111.66, 40.23]], // Provo / Utah Co
	['847', [-111.66, 40.23]], // Provo / Utah Co
	['845', [-110.49, 40.46]], // Eastern UT
	['84', [-111.66, 40.23]], // Utah fallback

	// Oregon
	['970', [-122.68, 45.52]], // Portland metro
	['971', [-122.68, 45.52]], // Portland metro
	['972', [-121.31, 44.06]], // Bend / Central OR
	['973', [-123.09, 44.05]], // Eugene
	['974', [-122.85, 42.33]], // Medford
	['975', [-122.85, 42.33]], // SW Oregon
	['976', [-121.0, 44.0]], // Central OR
	['977', [-119.0, 45.7]], // Eastern OR
	['978', [-117.8, 45.0]], // NE Oregon
	['979', [-118.9, 45.0]], // Eastern OR
	['97', [-121.0, 44.0]] // Oregon fallback
];

const US_CENTER: [number, number] = [-98.5, 39.8];

export function zipCentroid(zip: string): [number, number] {
	for (const [prefix, coord] of PREFIX_CENTROIDS) {
		if (zip.startsWith(prefix)) return coord;
	}
	return US_CENTER;
}
