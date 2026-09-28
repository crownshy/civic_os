import { describe, expect, it } from 'vitest';
import {
	cleanOptionLabel,
	findRepeatedOption,
	repeatedOptionIndexes
} from '@civicos/shared/data/demographics';

describe('cleanOptionLabel', () => {
	it('trims and collapses inner whitespace', () => {
		expect(cleanOptionLabel('  Some   college ')).toBe('Some college');
	});
});

describe('findRepeatedOption', () => {
	const options = ['Yes', 'No', 'Some college'];

	it('matches regardless of case and spacing', () => {
		expect(findRepeatedOption('yes', options)).toBe('Yes');
		expect(findRepeatedOption(' some  COLLEGE', options)).toBe('Some college');
	});

	it('ignores the row being edited', () => {
		expect(findRepeatedOption('yes', options, 0)).toBeUndefined();
	});

	it('never flags a blank draft', () => {
		expect(findRepeatedOption('   ', ['', 'Yes'])).toBeUndefined();
	});

	it('lets a new option through', () => {
		expect(findRepeatedOption('Maybe', options)).toBeUndefined();
	});
});

describe('repeatedOptionIndexes', () => {
	it('marks every repeat after the first occurrence', () => {
		expect([...repeatedOptionIndexes(['Yes', 'No', 'yes', 'YES '])]).toEqual([2, 3]);
	});

	it('is empty for distinct options', () => {
		expect(repeatedOptionIndexes(['Yes', 'No']).size).toBe(0);
	});
});
