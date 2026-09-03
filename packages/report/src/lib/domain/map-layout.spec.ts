import { describe, expect, it } from 'vitest';
import {
	DEMOG_LABEL_MIN_ZOOM,
	DEMOG_MAX_R,
	DEMOG_MIN_R,
	DEMOG_MINOR_LABEL_MIN_ZOOM,
	dotRadius,
	homeFitExtent,
	hoverBox,
	labelTextX,
	labelVisibility,
	minZoomScale,
	pillBox
} from './map-layout';

describe('dotRadius', () => {
	it('gives the smallest city the floor and the largest the ceiling', () => {
		expect(dotRadius(0, 100)).toBe(DEMOG_MIN_R);
		expect(dotRadius(100, 100)).toBe(DEMOG_MAX_R);
	});

	it('scales linearly between them, not by sqrt', () => {
		// sqrt is the usual choice for sizing circles by area; linear was picked
		// deliberately here, so pin it rather than let someone "correct" it
		expect(dotRadius(50, 100)).toBeCloseTo((DEMOG_MIN_R + DEMOG_MAX_R) / 2, 10);
	});

	it('is monotonic in count', () => {
		const radii = [1, 10, 40, 90].map((n) => dotRadius(n, 100));
		expect(radii).toEqual([...radii].sort((a, b) => a - b));
	});

	it('does not divide by zero when there are no participants anywhere', () => {
		expect(dotRadius(0, 0)).toBe(DEMOG_MIN_R);
	});
});

describe('homeFitExtent', () => {
	it('insets the fitted extent so markers and labels clear the edges', () => {
		expect(homeFitExtent(430, 860)).toEqual([
			[100, 100 + 860 * 0.16],
			[330, 760]
		]);
	});

	it('offsets the top proportionally, keeping the cluster clear of the eyebrow', () => {
		const [[, shortTop]] = homeFitExtent(430, 500);
		const [[, tallTop]] = homeFitExtent(430, 1000);
		expect(tallTop).toBeGreaterThan(shortTop);
	});
});

describe('minZoomScale', () => {
	it('picks whichever axis runs out of room first', () => {
		// 100 wide by 50 tall into a 200x200 viewport: width is the constraint
		expect(
			minZoomScale(
				[
					[0, 0],
					[100, 50]
				],
				200,
				200
			)
		).toBe(2);
	});

	it('is the scale at which the whole state fits, so zooming out lands on it', () => {
		expect(
			minZoomScale(
				[
					[0, 0],
					[400, 800]
				],
				400,
				400
			)
		).toBe(0.5);
	});
});

describe('label geometry', () => {
	it('tucks the label back into the dot edge', () => {
		expect(labelTextX(30)).toBe(20);
	});

	it('pads a pill around its text and rounds the ends fully', () => {
		const pill = pillBox({ x: 10, y: -12, width: 50, height: 20 });
		expect(pill).toEqual({ x: 1, y: -17, width: 68, height: 30, rx: 15 });
	});

	it('unions both tooltip lines rather than measuring either alone', () => {
		const name = { x: 10, y: -12, width: 50, height: 14 };
		const count = { x: 10, y: 9, width: 30, height: 12 };
		expect(hoverBox(name, count)).toEqual({ x: 1, y: -17, width: 68, height: 43, rx: 10 });
	});
});

describe('labelVisibility', () => {
	it('hides every label below the fade-out scale', () => {
		expect(labelVisibility(DEMOG_LABEL_MIN_ZOOM - 0.01).labelsHidden).toBe(true);
		expect(labelVisibility(DEMOG_LABEL_MIN_ZOOM).labelsHidden).toBe(false);
	});

	it('holds the smaller places back until further in', () => {
		expect(labelVisibility(DEMOG_MINOR_LABEL_MIN_ZOOM - 0.01).minorLabelsShown).toBe(false);
		expect(labelVisibility(DEMOG_MINOR_LABEL_MIN_ZOOM).minorLabelsShown).toBe(true);
	});

	it('shows major but not minor labels at the home view', () => {
		expect(labelVisibility(1)).toEqual({ labelsHidden: false, minorLabelsShown: false });
	});
});
