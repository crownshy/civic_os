import { describe, expect, it } from 'vitest';
import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
import { placeSchema } from './place-schema';

const area = { geoid: '41017', level: 'county', name: 'Deschutes County' };

describe('placeSchema', () => {
	const parse = (data: unknown) => placeSchema.safeParse(data).success;

	it('accepts a name and at least one area', () => {
		expect(parse({ name: 'Central Oregon', areas: [area] })).toBe(true);
	});

	it('needs at least one area', () => {
		expect(parse({ name: 'Central Oregon', areas: [] })).toBe(false);
	});

	it('needs a name that gives a slug, within the limit', () => {
		expect(parse({ name: '   ', areas: [area] })).toBe(false);
		expect(parse({ name: '--', areas: [area] })).toBe(false);
		expect(parse({ name: 'x'.repeat(TEXT_LIMITS.placeName + 1), areas: [area] })).toBe(false);
	});
});
