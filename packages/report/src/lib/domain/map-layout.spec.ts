import { describe, expect, it } from 'vitest';
import participantLocations from '../data/participant-locations.json';
import {
	DEMOG_LABEL_PAD_X,
	DEMOG_MAX_R,
	DEMOG_MIN_R,
	dotRadius,
	homeFitCities,
	homeFitExtent,
	labelModeFor,
	labelPaintOrder,
	labelTextX,
	miniLabelX,
	pillBox
} from './map-layout';

const cities = participantLocations.cities;

describe('labelModeFor', () => {
	it('shows no label at all when zoomed out past the threshold', () => {
		expect(labelModeFor(0.59, { mobile: false, major: true })).toBe('none');
		expect(labelModeFor(0.59, { mobile: true, major: false })).toBe('none');
	});

	it('gives majors a pill and minors a mini label on desktop between the thresholds', () => {
		expect(labelModeFor(0.6, { mobile: false, major: true })).toBe('pill');
		expect(labelModeFor(0.6, { mobile: false, major: false })).toBe('mini');
		expect(labelModeFor(1.79, { mobile: false, major: false })).toBe('mini');
	});

	it('gives every place a mini label on mobile between the thresholds', () => {
		expect(labelModeFor(1, { mobile: true, major: true })).toBe('mini');
		expect(labelModeFor(1.34, { mobile: true, major: false })).toBe('mini');
	});

	it('gives every place a pill from 1.8 on desktop and from 1.35 on mobile', () => {
		expect(labelModeFor(1.8, { mobile: false, major: false })).toBe('pill');
		expect(labelModeFor(1.35, { mobile: true, major: false })).toBe('pill');
		expect(labelModeFor(1.35, { mobile: false, major: false })).toBe('mini');
	});
});

describe('label geometry', () => {
	const radius = 20;
	const text = { x: labelTextX(radius), y: -12, width: 60, height: 20 };
	const pill = pillBox(text, radius);

	it('starts the text PAD_X clear of the dot', () => {
		expect(text.x - radius).toBe(DEMOG_LABEL_PAD_X);
	});

	it('pads the text equally on the side the dot leaves visible and the far side', () => {
		const visibleLeft = text.x - radius;
		const right = pill.x + pill.width - (text.x + text.width);
		expect(right).toBe(visibleLeft);
	});

	it('starts the pill under the dot, so there is no seam between them', () => {
		expect(pill.x).toBe(radius - 3);
	});

	it('starts a mini label just past the dot', () => {
		expect(miniLabelX(radius)).toBe(radius + 3);
	});
});

describe('homeFitExtent', () => {
	it('fits desktop between the stat block and the bar, wider on the right for labels', () => {
		expect(homeFitExtent({ width: 1200, height: 800, statHeight: 200, barHeight: 96 })).toEqual([
			[44, 214],
			[1108, 688]
		]);
	});

	it('uses tighter sides and more room under the stat block on mobile', () => {
		expect(homeFitExtent({ width: 390, height: 700, statHeight: 150, barHeight: 70 })).toEqual([
			[18, 176],
			[314, 614]
		]);
	});

	it('falls back to a share of the height before the stat block is measured', () => {
		const [[, top]] = homeFitExtent({ width: 1000, height: 1000, statHeight: 0, barHeight: 96 });
		expect(top).toBe(294);
	});
});

describe('homeFitCities', () => {
	it('fits every place on desktop', () => {
		expect(homeFitCities(cities, false)).toHaveLength(cities.length);
	});

	it('fits only the tri-county places on mobile, which leaves Antelope out', () => {
		const names = homeFitCities(cities, true).map((c) => c.name);
		expect(names).not.toContain('Antelope');
		expect(names).toContain('Madras');
		expect(names).toHaveLength(cities.length - 1);
	});
});

describe('labelPaintOrder', () => {
	it('paints every major place after every minor one', () => {
		const order = labelPaintOrder(cities);
		const firstMajor = order.findIndex((i) => cities[i].major);
		expect(order).toHaveLength(cities.length);
		expect(order.slice(firstMajor).every((i) => cities[i].major)).toBe(true);
	});
});

describe('dotRadius', () => {
	it('runs linearly from the minimum to the maximum radius', () => {
		expect(dotRadius(0, 100)).toBe(DEMOG_MIN_R);
		expect(dotRadius(100, 100)).toBe(DEMOG_MAX_R);
	});
});
