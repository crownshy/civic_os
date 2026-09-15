/**
 * The demographics map's geometry, separated from the d3 calls that apply it.
 *
 * The projection and the gesture handling stay with d3; what lives here is the
 * arithmetic around them: how big a marker is, where the home view sits, how
 * far out you can zoom, how a label pill wraps its text, and which label a
 * place carries at a given zoom.
 */

/** Deschutes, Crook and Jefferson: the region the report is about. */
export const TRI_COUNTIES = [
	{ fips: '41017', name: 'Deschutes' },
	{ fips: '41013', name: 'Crook' },
	{ fips: '41031', name: 'Jefferson' }
] as const;

/** the county GeoJSON is keyed by FIPS code, the city data by county name */
export const TRI_COUNTY_FIPS: ReadonlySet<string> = new Set(TRI_COUNTIES.map((c) => c.fips));
const TRI_COUNTY_NAMES: ReadonlySet<string> = new Set(TRI_COUNTIES.map((c) => c.name));

/** the map is laid out for mobile below this width */
export const MOBILE_MAX_WIDTH = 660;

export const DEMOG_MIN_R = 13;
export const DEMOG_MAX_R = 70;

/** multiple of the home (city-cluster) fit scale */
export const DEMOG_MAX_ZOOM_IN = 8;

export const DEMOG_LABEL_PAD_X = 9;
export const DEMOG_LABEL_PAD_Y = 5;
/** the pill starts this far inside the dot's edge, under the opaque dot, so there is no seam */
const PILL_TUCK = 3;
const MINI_LABEL_GAP = 3;

/** below this scale (relative to the k=1 home view) no place carries a label */
export const DEMOG_LABEL_MIN_ZOOM = 0.6;
/** from this scale up every place carries a pill; lower on mobile, where the view starts crowded */
export const DEMOG_PILL_ZOOM = { desktop: 1.8, mobile: 1.35 } as const;

/** the right inset is the wider one because every label extends right of its dot */
const HOME_SIDES = { desktop: { left: 44, right: 92 }, mobile: { left: 18, right: 76 } } as const;
const STAT_CLEARANCE = { desktop: 14, mobile: 26 } as const;
const BAR_CLEARANCE = 16;
/** the stat block's share of the height, until it has been measured */
const STAT_FALLBACK_RATIO = 0.28;

export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

export type Extent = [[number, number], [number, number]];

export type LabelMode = 'none' | 'mini' | 'pill';

export function isMobileWidth(width: number): boolean {
	return width < MOBILE_MAX_WIDTH;
}

/**
 * Marker radius as a straight ratio of a city's count to the largest city's,
 * NOT compressed toward the top the way a sqrt scale would, settled on after
 * live A/B'ing both against the base size.
 */
export function dotRadius(count: number, maxCount: number): number {
	if (maxCount <= 0) return DEMOG_MIN_R;
	return DEMOG_MIN_R + (DEMOG_MAX_R - DEMOG_MIN_R) * (count / maxCount);
}

/**
 * Which label a place carries at a zoom scale. Between the two thresholds the
 * major places keep their pill on desktop while the rest carry a mini label;
 * on mobile everything carries a mini label until the pill threshold.
 */
export function labelModeFor(
	scale: number,
	{ mobile, major }: { mobile: boolean; major: boolean }
): LabelMode {
	if (scale < DEMOG_LABEL_MIN_ZOOM) return 'none';
	if (scale >= (mobile ? DEMOG_PILL_ZOOM.mobile : DEMOG_PILL_ZOOM.desktop)) return 'pill';
	return major && !mobile ? 'pill' : 'mini';
}

/** Where a label's text starts: clear of the dot by the pill's own padding. */
export function labelTextX(radius: number): number {
	return radius + DEMOG_LABEL_PAD_X;
}

export function miniLabelX(radius: number): number {
	return radius + MINI_LABEL_GAP;
}

/**
 * The pill behind a label, from that label's own text box. It ends PAD_X past
 * the text, and the text starts PAD_X past the dot, so the visible padding is
 * the same on both sides.
 */
export function pillBox(text: Box, radius: number): Box & { rx: number } {
	const x = radius - PILL_TUCK;
	return {
		x,
		y: text.y - DEMOG_LABEL_PAD_Y,
		width: text.x + text.width + DEMOG_LABEL_PAD_X - x,
		height: text.height + DEMOG_LABEL_PAD_Y * 2,
		rx: text.height / 2 + DEMOG_LABEL_PAD_Y
	};
}

/** The tooltip box behind a city's name and count, padded around both. */
export function hoverBox(name: Box, count: Box): Box & { rx: number } {
	const x = Math.min(name.x, count.x);
	const y = Math.min(name.y, count.y);
	const right = Math.max(name.x + name.width, count.x + count.width);
	const bottom = Math.max(name.y + name.height, count.y + count.height);
	return {
		x: x - DEMOG_LABEL_PAD_X,
		y: y - DEMOG_LABEL_PAD_Y,
		width: right - x + DEMOG_LABEL_PAD_X * 2,
		height: bottom - y + DEMOG_LABEL_PAD_Y * 2,
		rx: 10
	};
}

/**
 * The frame the home view fits the city points into: the band between the
 * stat block overlaid at the top and the bottom page bar.
 */
export function homeFitExtent({
	width,
	height,
	statHeight,
	barHeight
}: {
	width: number;
	height: number;
	statHeight: number;
	barHeight: number;
}): Extent {
	const mobile = isMobileWidth(width);
	const sides = mobile ? HOME_SIDES.mobile : HOME_SIDES.desktop;
	const stat = statHeight > 0 ? statHeight : height * STAT_FALLBACK_RATIO;
	const top = stat + (mobile ? STAT_CLEARANCE.mobile : STAT_CLEARANCE.desktop);
	return [
		[sides.left, top],
		[width - sides.right, height - barHeight - BAR_CLEARANCE]
	];
}

/**
 * The places the home view fits: the points, not the county polygons, which
 * include a lot of empty land. Mobile fits only the tri-county places, so the
 * view starts zoomed in on them; the one outside still renders, just above the
 * frame, behind the stat block.
 */
export function homeFitCities<T extends { county: string }>(
	cities: readonly T[],
	mobile: boolean
): T[] {
	return mobile ? cities.filter((c) => TRI_COUNTY_NAMES.has(c.county)) : [...cities];
}

/** City indices in label paint order: majors last, so their pills cover the minor places' mini labels. */
export function labelPaintOrder(cities: readonly { major?: boolean }[]): number[] {
	return cities
		.map((_, i) => i)
		.sort((a, b) => Number(Boolean(cities[a].major)) - Number(Boolean(cities[b].major)));
}

/**
 * How far out the map may zoom: the scale at which the FULL 36-county
 * collection fits the viewport. That is what makes "zoom all the way out" land
 * on the real Oregon outline rather than an arbitrary crop.
 */
export function minZoomScale(bounds: Extent, width: number, height: number): number {
	const [[x0, y0], [x1, y1]] = bounds;
	return Math.min(width / (x1 - x0), height / (y1 - y0));
}
