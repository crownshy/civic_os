/**
 * The demographics map's geometry, separated from the d3 calls that apply it.
 *
 * The projection and the gesture handling stay with d3; what lives here is the
 * arithmetic around them: how big a marker is, where the home view sits, how
 * far out you can zoom, how a label pill wraps its text.
 */

/** Deschutes, Crook and Jefferson: the region the report is about. */
export const TRI_COUNTY_FIPS = new Set(['41017', '41013', '41031']);

export const DEMOG_MIN_R = 13;
export const DEMOG_MAX_R = 70;

/** multiple of the home (city-cluster) fit scale */
export const DEMOG_MAX_ZOOM_IN = 8;
/** ms */
export const DEMOG_RESET_DURATION = 500;

/** px the label pill tucks into the dot's edge */
export const DEMOG_LABEL_OVERLAP = 10;
export const DEMOG_LABEL_PAD_X = 9;
export const DEMOG_LABEL_PAD_Y = 5;

/**
 * Below this scale (relative to the k=1 home view) major-city labels fade out,
 * so a zoomed-out view reads as dots-in-context rather than a wall of
 * overlapping pills. Minor cities only earn a label further in.
 */
export const DEMOG_LABEL_MIN_ZOOM = 0.6;
export const DEMOG_MINOR_LABEL_MIN_ZOOM = 1.8;

/** bigger = more surrounding context in view = more zoomed out */
const HOME_PAD = 100;
/** pushes the cluster down clear of the eyebrow text overlaid at the top */
const HOME_TOP_OFFSET_RATIO = 0.16;

export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

export type Extent = [[number, number], [number, number]];

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
 * The extent the home view fits the city POINTS into, not the tri-county
 * polygons, which include a lot of empty land the report doesn't care about.
 * Fitting to where the markers actually sit keeps the default view on the
 * cities themselves.
 */
export function homeFitExtent(width: number, height: number): Extent {
	const topOffset = height * HOME_TOP_OFFSET_RATIO;
	return [
		[HOME_PAD, HOME_PAD + topOffset],
		[width - HOME_PAD, height - HOME_PAD]
	];
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

/** Where a city's label text starts, tucked back into the dot's edge. */
export function labelTextX(radius: number): number {
	return radius - DEMOG_LABEL_OVERLAP;
}

/** The rounded pill drawn behind a label, from that label's own text box. */
export function pillBox(text: Box): Box & { rx: number } {
	return {
		x: text.x - DEMOG_LABEL_PAD_X,
		y: text.y - DEMOG_LABEL_PAD_Y,
		width: text.width + DEMOG_LABEL_PAD_X * 2,
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

/** Which label tiers are shown at a given zoom scale. */
export function labelVisibility(scale: number): {
	labelsHidden: boolean;
	minorLabelsShown: boolean;
} {
	return {
		labelsHidden: scale < DEMOG_LABEL_MIN_ZOOM,
		minorLabelsShown: scale >= DEMOG_MINOR_LABEL_MIN_ZOOM
	};
}
