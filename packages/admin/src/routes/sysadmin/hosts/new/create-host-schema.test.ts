import { describe, it, expect } from 'vitest';
import { createHostSchema } from './create-host-schema';

const parse = (fields: Record<string, unknown>) =>
	createHostSchema.safeParse({ name: 'Dundee Civic Trust', ...fields });

describe('createHostSchema', () => {
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
