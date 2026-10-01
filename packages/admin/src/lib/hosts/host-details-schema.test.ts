import { describe, it, expect } from 'vitest';
import { hostDetailsSchema, toExternalUrl, toWebsite } from './host-details-schema';

const parse = (fields: Record<string, unknown>) =>
	hostDetailsSchema.safeParse({ name: 'Dundee Civic Trust', ...fields });

describe('hostDetailsSchema', () => {
	it('creates a Host with no description (#475)', () => {
		expect(parse({}).success).toBe(true);
		expect(parse({ description: '' }).success).toBe(true);
	});

	it('rejects a name with no letter or number (#492)', () => {
		for (const name of ['-', '?', '*', '  ', '!!']) expect(parse({ name }).success).toBe(false);
		expect(parse({ name: 'Ó Néill' }).success).toBe(true);
		expect(parse({ name: '311' }).success).toBe(true);
	});

	// The form validates as you type and writes the parsed value back (#458).
	it('leaves a trailing space where it was typed', () => {
		const result = parse({ name: 'Dundee ', description: 'We run ' });
		expect(result.success && result.data.name).toBe('Dundee ');
		expect(result.success && result.data.description).toBe('We run ');
	});
});

describe('toExternalUrl / toWebsite', () => {
	it('adds https:// only when no protocol was typed', () => {
		expect(toExternalUrl(' dundee.org ')).toBe('https://dundee.org');
		expect(toExternalUrl('http://dundee.org')).toBe('http://dundee.org');
	});

	// The backend ignores null on update; an empty string is what clears it (#450).
	it('sends an empty website as an empty string', () => {
		expect(toExternalUrl('  ')).toBe('');
	});

	it('round-trips through the form', () => {
		expect(toWebsite(toExternalUrl('dundee.org/about'))).toBe('dundee.org/about');
		expect(toWebsite(null)).toBe('');
	});
});
