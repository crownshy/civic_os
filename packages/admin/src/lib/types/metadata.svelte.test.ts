import { describe, it, expect } from 'vitest';
import { parseMetadata, toThemeDefinitions } from './metadata';

describe('parseMetadata', () => {
	it('reads the theme dictionary out of a well-formed blob', () => {
		const { themes, error } = parseMetadata({
			themes: { Housing: { description: 'Supply and affordability' } }
		});

		expect(error).toBeNull();
		expect(themes).toEqual({ Housing: { description: 'Supply and affordability' } });
	});

	it('treats a missing themes key as an empty dictionary, not an error', () => {
		const { themes, error } = parseMetadata({ someOtherKey: 123 });

		expect(error).toBeNull();
		expect(themes).toEqual({});
	});

	it('treats absent metadata as an empty dictionary', () => {
		expect(parseMetadata(undefined)).toEqual({ themes: {}, error: null });
	});

	it('defaults a missing description to an empty string', () => {
		const { themes, error } = parseMetadata({ themes: { Housing: {} } });

		expect(error).toBeNull();
		expect(themes.Housing.description).toBe('');
	});

	it('reports malformed themes without throwing, falling back to an empty dictionary', () => {
		// `themes` must be a map of entries — a string is the wrong shape entirely.
		const { themes, error } = parseMetadata({ themes: 'Housing' });

		expect(themes).toEqual({});
		expect(error).toMatch(/malformed/i);
	});

	it('reports a malformed entry inside an otherwise valid dictionary', () => {
		const { themes, error } = parseMetadata({ themes: { Housing: { description: 5 } } });

		expect(themes).toEqual({});
		expect(error).toContain('themes.Housing.description');
	});
});

describe('toThemeDefinitions', () => {
	it('flattens the dictionary into name-sorted definitions', () => {
		const defs = toThemeDefinitions({
			Transport: { description: 'buses' },
			Housing: { description: 'homes' }
		});

		expect(defs).toEqual([
			{ name: 'Housing', description: 'homes' },
			{ name: 'Transport', description: 'buses' }
		]);
	});

	it('returns nothing for an empty dictionary', () => {
		expect(toThemeDefinitions({})).toEqual([]);
	});
});
