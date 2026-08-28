import { describe, expect, it } from 'vitest';
import { listSeparator } from './list';

function sentence(items: string[]): string {
	return items.map((item, i) => item + listSeparator(i, items.length)).join('');
}

describe('listSeparator', () => {
	it('leaves a single item bare', () => {
		expect(sentence(['A'])).toBe('A');
	});

	it('joins a pair without a comma', () => {
		expect(sentence(['A', 'B'])).toBe('A and B');
	});

	it('uses an Oxford comma from three items up', () => {
		expect(sentence(['A', 'B', 'C'])).toBe('A, B, and C');
		expect(sentence(['A', 'B', 'C', 'D'])).toBe('A, B, C, and D');
	});
});
