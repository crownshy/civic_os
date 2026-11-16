import { describe, expect, it } from 'vitest';
import { seedPlaces } from './seed-places';

const countiesIn = (stateId: string) =>
	seedPlaces.filter((place) => place.level === 'county' && place.ancestorIds[0] === stateId);

describe('seedPlaces', () => {
	it('has every Oregon and Utah county', () => {
		expect(countiesIn('state-41')).toHaveLength(36);
		expect(countiesIn('state-49')).toHaveLength(29);
	});

	it('gives each state its county count', () => {
		const oregon = seedPlaces.find((place) => place.id === 'state-41')!;
		expect(oregon.childCount).toBe(36);
	});

	it('keeps the seeded cities under their counties', () => {
		const bend = seedPlaces.find((place) => place.name === 'Bend')!;
		expect(bend.ancestorIds).toEqual(['county-41017', 'state-41']);
		expect(bend.context).toBe('Deschutes County, OR');
	});

	it('has no duplicate ids', () => {
		const ids = seedPlaces.map((place) => place.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
