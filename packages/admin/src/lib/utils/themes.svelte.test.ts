import { describe, it, expect } from 'vitest';
import type { PolisStatementAux } from '$lib/types/aux';
import { buildThemeSummaries } from './themes';

/** Minimal aux row carrying the themes under test; other fields are irrelevant here. */
function auxRow(polis_statement_id: number, themes: string[]): PolisStatementAux {
	return {
		id: `00000000-0000-0000-0000-${String(polis_statement_id).padStart(12, '0')}`,
		workflow_step_id: '00000000-0000-0000-0000-00000000step',
		polis_conversation_id: 'test-poll',
		polis_statement_id,
		statement_text: 'stmt',
		moderation_status: 'accepted',
		is_seed: false,
		themes,
		zid: 1,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z'
	} as PolisStatementAux;
}

const auxMap = (rows: PolisStatementAux[]): Record<number, PolisStatementAux> =>
	Object.fromEntries(rows.map((r) => [r.polis_statement_id, r]));

const dict = (...names: string[]) =>
	Object.fromEntries(names.map((n) => [n, { description: `${n} desc` }]));

const countOf = (summaries: { theme: string; statementCount: number }[], theme: string) =>
	summaries.find((s) => s.theme === theme)?.statementCount;

describe('buildThemeSummaries', () => {
	it('includes a dictionary theme with no statements, at count 0', () => {
		const summaries = buildThemeSummaries(dict('Housing'), {}, null);

		expect(summaries).toHaveLength(1);
		expect(summaries[0]).toMatchObject({ theme: 'Housing', statementCount: 0 });
	});

	it('counts how many statements carry each theme', () => {
		const summaries = buildThemeSummaries(
			dict('Housing', 'Transport'),
			auxMap([auxRow(1, ['Housing']), auxRow(2, ['Housing', 'Transport']), auxRow(3, [])]),
			null
		);

		expect(countOf(summaries, 'Housing')).toBe(2);
		expect(countOf(summaries, 'Transport')).toBe(1);
	});

	it('still includes a theme applied to statements but missing from the dictionary', () => {
		// Legacy free-text tags (or ones added by the comhairle UI) must not vanish.
		const summaries = buildThemeSummaries({}, auxMap([auxRow(1, ['legacy-tag'])]), null);

		expect(summaries).toEqual([
			expect.objectContaining({ theme: 'legacy-tag', statementCount: 1 })
		]);
	});

	it('unions both sources without double-counting a theme in each', () => {
		const summaries = buildThemeSummaries(
			dict('Housing', 'Unused'),
			auxMap([auxRow(1, ['Housing', 'orphan'])]),
			null
		);

		expect(summaries.map((s) => s.theme).sort()).toEqual(['Housing', 'Unused', 'orphan']);
		expect(countOf(summaries, 'Housing')).toBe(1);
	});

	it('sorts by statement count, descending', () => {
		const summaries = buildThemeSummaries(
			dict('Rare', 'Common', 'Unused'),
			auxMap([auxRow(1, ['Common', 'Rare']), auxRow(2, ['Common'])]),
			null
		);

		expect(summaries.map((s) => s.theme)).toEqual(['Common', 'Rare', 'Unused']);
	});

	it('returns nothing when there is no dictionary and no tagged statement', () => {
		expect(buildThemeSummaries({}, {}, null)).toEqual([]);
	});

	it("falls back to 'low' controversy when there is no report data", () => {
		const summaries = buildThemeSummaries(dict('Housing'), auxMap([auxRow(1, ['Housing'])]), null);

		expect(summaries[0].controversy).toBe('low');
	});
});
