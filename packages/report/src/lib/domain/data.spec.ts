import { describe, expect, it } from 'vitest';
import {
	buildThemeView,
	byStatementRank,
	groupsOf,
	isLowData,
	quotesForTheme,
	recordsForTheme,
	statementsForTheme
} from './data';
import type { Group, GroupTally, ReportRecord, Theme, Vote } from './types';

const tally = (pct: number, n = 20): GroupTally => ({ a: n, d: 0, p: 0, n, pct });

const vote = (
	minAgree: number,
	total: number,
	gap = 0,
	tallies: Record<string, GroupTally> = {}
): Vote => ({ minAgree, total, gap, groups: tallies });

const record = (id: string, over: Partial<ReportRecord> = {}): ReportRecord => ({
	id,
	kind: 'poll',
	text: `text ${id}`,
	origin: 'participant',
	place: null,
	chips: [],
	vote: vote(50, 100),
	source: 'Open Poll',
	tags: [],
	inReport: true,
	...over
});

const theme = (key: string, tags: string[]): Theme => ({
	key,
	short: key,
	full: key,
	color: '#000',
	tags
});

describe('recordsForTheme', () => {
	const governance = theme('governance', ['Governance', 'Public Service']);
	const datacenters = theme('datacenters', ['Data Centers']);

	it('claims a record carrying any one of its tags', () => {
		const records = [record('p1', { tags: ['Public Service'] })];
		expect(recordsForTheme(records, governance).map((r) => r.id)).toEqual(['p1']);
	});

	it('puts a record spanning two subjects in both themes', () => {
		const records = [record('p1', { tags: ['Governance', 'Data Centers'] })];
		expect(recordsForTheme(records, governance)).toHaveLength(1);
		expect(recordsForTheme(records, datacenters)).toHaveLength(1);
	});

	it('drops a record no theme claims', () => {
		// membership is derived, so an untagged record vanishes from the report
		// rather than landing somewhere wrong
		const records = [record('p1', { tags: ['Untagged'] })];
		expect(recordsForTheme(records, governance)).toEqual([]);
		expect(recordsForTheme(records, datacenters)).toEqual([]);
	});

	it('separates poll statements from session quotes', () => {
		const records = [
			record('p1', { tags: ['Governance'] }),
			record('q1', { tags: ['Governance'], kind: 'quote', vote: null })
		];
		expect(statementsForTheme(records, governance).map((r) => r.id)).toEqual(['p1']);
		expect(quotesForTheme(records, governance).map((r) => r.id)).toEqual(['q1']);
	});
});

describe('byStatementRank', () => {
	it('puts broader agreement first', () => {
		const low = record('low', { vote: vote(40, 100) });
		const high = record('high', { vote: vote(90, 100) });
		expect([low, high].sort(byStatementRank).map((r) => r.id)).toEqual(['high', 'low']);
	});

	it('breaks a tie on how many people voted', () => {
		const few = record('few', { vote: vote(90, 10) });
		const many = record('many', { vote: vote(90, 200) });
		expect([few, many].sort(byStatementRank).map((r) => r.id)).toEqual(['many', 'few']);
	});

	it('sorts a record with no vote last rather than throwing', () => {
		const voteless = record('none', { vote: null });
		const normal = record('normal', { vote: vote(0, 0) });
		expect([voteless, normal].sort(byStatementRank).map((r) => r.id)).toEqual(['normal', 'none']);
	});

	it('sorts a low-data statement after the others, however broad its agreement', () => {
		const thin = record('thin', { vote: vote(99, 300, 0, { A: tally(99, 4), B: tally(99, 40) }) });
		const plain = record('plain', { vote: vote(40, 100, 0, { A: tally(40), B: tally(40) }) });
		expect([thin, plain].sort(byStatementRank).map((r) => r.id)).toEqual(['plain', 'thin']);
	});

	it('keeps the usual ranking among low-data statements', () => {
		const low = record('low', { vote: vote(40, 100, 0, { A: tally(40, 3) }) });
		const high = record('high', { vote: vote(90, 100, 0, { A: tally(90, 3) }) });
		expect([low, high].sort(byStatementRank).map((r) => r.id)).toEqual(['high', 'low']);
	});
});

describe('isLowData', () => {
	it('flags a statement when any one group cast fewer than 8 votes', () => {
		expect(isLowData(vote(50, 100, 0, { A: tally(50, 30), B: tally(50, 7) }))).toBe(true);
	});

	it('does not flag a group that cast exactly 8', () => {
		expect(isLowData(vote(50, 100, 0, { A: tally(50, 30), B: tally(50, 8) }))).toBe(false);
	});
});

describe('buildThemeView', () => {
	const governance = theme('governance', ['Governance']);

	it('ranks the theme statements', () => {
		const records = [
			record('p1', { tags: ['Governance'], vote: vote(40, 100) }),
			record('p2', { tags: ['Governance'], vote: vote(90, 100) })
		];
		const view = buildThemeView(records, governance);
		expect(view.statements.map((r) => r.id)).toEqual(['p2', 'p1']);
	});

	it('appends an insight-cited record from outside the theme', () => {
		const records = [record('p1', { tags: ['Governance'] }), record('p9', { tags: ['Elsewhere'] })];
		const view = buildThemeView(records, governance, [
			{ claim: 'c', direction: 'agree', ids: ['p9'] }
		]);

		expect(view.statements.map((r) => r.id)).toEqual(['p1']);
		expect(view.items.map((r) => r.id)).toEqual(['p1', 'p9']);
	});

	it('does not repeat a cited record that is already a theme statement', () => {
		const records = [record('p1', { tags: ['Governance'] })];
		const view = buildThemeView(records, governance, [
			{ claim: 'c', direction: 'agree', ids: ['p1', 'p1'] }
		]);
		expect(view.items.map((r) => r.id)).toEqual(['p1']);
	});

	it('ignores a citation to an id that does not resolve', () => {
		const records = [record('p1', { tags: ['Governance'] })];
		const view = buildThemeView(records, governance, [
			{ claim: 'c', direction: 'agree', ids: ['gone'] }
		]);
		expect(view.items.map((r) => r.id)).toEqual(['p1']);
	});
});

describe('groupsOf', () => {
	const groups: Group[] = [
		{ key: 'A', label: 'Group A' },
		{ key: 'B', label: 'Group B' }
	];

	it('merges each group tally on, in the declared group order', () => {
		const v = vote(60, 100, 20, { B: tally(80), A: tally(60) });
		// order comes from groups[], not from the vote's key order
		expect(groupsOf(groups, v).map((g) => [g.key, g.pct])).toEqual([
			['A', 60],
			['B', 80]
		]);
	});

	it('still lists a group the statement has no tally for', () => {
		const v = vote(60, 100, 0, { A: tally(60) });
		const merged = groupsOf(groups, v);
		expect(merged[1]).toEqual({ key: 'B', label: 'Group B' });
	});
});
