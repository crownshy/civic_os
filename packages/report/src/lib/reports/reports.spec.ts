import { describe, expect, it } from 'vitest';
import type { Report } from '../domain/report';
import { REPORT_SLUGS, loadReport } from './index';

/**
 * The checks upstream's build runs over each report's data before it will
 * publish it. Nothing here is about one report's numbers; it is about the
 * references between its files holding, so a bad merge or a hand edit fails
 * here rather than as an empty page or a NaN.
 */

const reports = await Promise.all(
	REPORT_SLUGS.map(async (slug) => [slug, (await loadReport(slug)) as Report] as const)
);

describe.each(reports)('%s', (_slug, report) => {
	const groupKeys = report.groups.map((group) => group.key);
	const recordIds = new Set(report.records.map((record) => record.id));

	it('has a unique key per theme and per group', () => {
		expect(new Set(report.themes.map((theme) => theme.key)).size).toBe(report.themes.length);
		expect(new Set(groupKeys).size).toBe(groupKeys.length);
	});

	it('cites statements that exist', () => {
		const cited = [
			...Object.values(report.insights).flatMap((insights) => insights.flatMap((i) => i.ids)),
			...Object.values(report.groupStatements).flatMap((rows) => rows.map((row) => row.id)),
			...report.consensusIds
		];
		expect(cited.filter((id) => !recordIds.has(id))).toEqual([]);
	});

	it('describes the same groups everywhere', () => {
		expect(Object.keys(report.groupInfo).sort()).toEqual([...groupKeys].sort());
		expect(Object.keys(report.groupStatements).sort()).toEqual([...groupKeys].sort());
	});

	it('gives every voted statement a tally for every group', () => {
		const missing = report.records
			.filter((record) => record.vote)
			.filter((record) => groupKeys.some((key) => !record.vote?.groups[key]))
			.map((record) => record.id);
		expect(missing).toEqual([]);
	});

	it('has a population share for every demographic the poll measured', () => {
		for (const category of report.demographics.poll.categories) {
			const actual = report.demographics.actual[category.key] ?? {};
			expect(category.breakdown.filter((row) => actual[row.label] === undefined)).toEqual([]);
		}
	});

	it('knows its home counties from its own county map', () => {
		const fips = new Set(
			(report.counties as { features: { id: string }[] }).features.map((f) => String(f.id))
		);
		const homeFips = Object.keys(report.config.map.homeCounties);
		expect(homeFips.length).toBeGreaterThan(0);
		expect(homeFips.filter((code) => !fips.has(code))).toEqual([]);
	});
});
