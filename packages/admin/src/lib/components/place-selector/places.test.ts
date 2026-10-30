import { describe, expect, it } from 'vitest';
import { fixturePlaces } from './fixture';
import {
	coveringAncestorId,
	rankSearchResults,
	SEARCH_LIMIT,
	unionBbox,
	type Place
} from './places';

const madras = fixturePlaces.find((place) => place.name === 'Madras')!;

function city(name: string, index: number): Place {
	return {
		id: `city-${index}`,
		level: 'city',
		name,
		ancestorIds: [],
		context: '',
		childCount: 0,
		bbox: [0, 0, 1, 1]
	};
}

describe('coveringAncestorId', () => {
	it('is null when no ancestor is selected', () => {
		expect(coveringAncestorId(madras, ['city-4145250'])).toBeNull();
	});

	it('finds the nearest selected ancestor', () => {
		expect(coveringAncestorId(madras, ['state-41', 'county-41031'])).toBe('county-41031');
	});

	it('looks past an unselected county to a selected state', () => {
		expect(coveringAncestorId(madras, ['state-41'])).toBe('state-41');
	});
});

describe('rankSearchResults', () => {
	it('matches by name prefix, ignoring case and surrounding space', () => {
		const names = rankSearchResults(fixturePlaces, '  sa ').places.map((place) => place.name);
		expect(names).toEqual([
			'Salt Lake County',
			'San Francisco County',
			'Salt Lake City',
			'San Francisco',
			'Sandy'
		]);
	});

	it('orders states, then counties, then cities', () => {
		const levels = rankSearchResults(fixturePlaces, 'o').places.map((place) => place.level);
		expect(levels).toEqual(['state', 'city']);
	});

	it('is empty for a blank query', () => {
		expect(rankSearchResults(fixturePlaces, '   ')).toEqual({ places: [], total: 0 });
	});

	it(`caps at ${SEARCH_LIMIT} and still counts every match`, () => {
		const many = Array.from({ length: 200 }, (_, index) => city(`Springfield ${index}`, index));
		const result = rankSearchResults(many, 'spring');
		expect(result.places).toHaveLength(SEARCH_LIMIT);
		expect(result.total).toBe(200);
	});
});

describe('unionBbox', () => {
	it('is null with nothing to frame', () => {
		expect(unionBbox([])).toBeNull();
	});

	it('spans every box', () => {
		expect(
			unionBbox([
				[-122, 44, -121, 45],
				[-112, 40, -111, 41]
			])
		).toEqual([-122, 40, -111, 45]);
	});
});
