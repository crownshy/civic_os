import { describe, it, expect } from 'vitest';
import { parseSeedCsv } from './seed-csv';

describe('parseSeedCsv', () => {
	it('reads one statement per line and skips blanks', () => {
		expect(parseSeedCsv('Parks need lights\n\n  Buses should run later  \n')).toEqual([
			'Parks need lights',
			'Buses should run later'
		]);
	});

	it('drops a header row, whatever its case', () => {
		expect(parseSeedCsv('Statement\r\nParks need lights')).toEqual(['Parks need lights']);
	});

	it('keeps a statement that happens to be a header word when it is not first', () => {
		expect(parseSeedCsv('Parks need lights\ntext')).toEqual(['Parks need lights', 'text']);
	});

	it('unwraps spreadsheet quoting without splitting on commas', () => {
		expect(parseSeedCsv('"Parks, pools, and libraries"\n"Say ""yes"" to buses"')).toEqual([
			'Parks, pools, and libraries',
			'Say "yes" to buses'
		]);
	});

	it('returns nothing for a header-only file', () => {
		expect(parseSeedCsv('statements\n')).toEqual([]);
	});
});
