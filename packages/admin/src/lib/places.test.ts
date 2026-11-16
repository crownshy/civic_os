import { describe, expect, it } from 'vitest';
import { placeFromRegion, placeMetadata, placeWithSlug } from './places';

const deschutes = { geoid: '41017', level: 'county' as const, name: 'Deschutes County' };

describe('placeFromRegion', () => {
	it('reads the stored slug and areas', () => {
		const place = placeFromRegion({
			id: 'r1',
			name: 'Central Oregon',
			metadata: { slug: 'central-oregon', areas: [deschutes] }
		});

		expect(place).toEqual({
			id: 'r1',
			name: 'Central Oregon',
			slug: 'central-oregon',
			areas: [deschutes]
		});
	});

	it('derives a slug from the name for a Region with no metadata', () => {
		expect(placeFromRegion({ id: 'r2', name: 'Utah', metadata: null })).toMatchObject({
			slug: 'utah',
			areas: []
		});
	});

	it('ignores a blank stored slug', () => {
		expect(placeFromRegion({ id: 'r3', name: 'Utah', metadata: { slug: '  ' } }).slug).toBe('utah');
	});
});

describe('placeMetadata', () => {
	it('derives the slug from the name', () => {
		expect(placeMetadata('Central Oregon', [deschutes])).toEqual({
			slug: 'central-oregon',
			areas: [deschutes]
		});
	});
});

describe('placeWithSlug', () => {
	const places = [
		{ id: 'r1', name: 'Utah', slug: 'utah', areas: [] },
		{ id: 'r2', name: 'Oregon', slug: 'oregon', areas: [] }
	];

	it('finds another Place on the same slug', () => {
		expect(placeWithSlug(places, 'utah')?.id).toBe('r1');
	});

	it('does not count the Place being edited', () => {
		expect(placeWithSlug(places, 'utah', 'r1')).toBeNull();
	});
});
