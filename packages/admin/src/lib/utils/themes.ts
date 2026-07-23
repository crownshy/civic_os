/**
 * Theme roll-up for the Insights "Themes" card.
 *
 * Kept out of the page component so it can be unit tested (see
 * `themes.svelte.test.ts`), mirroring the pure helpers in `report.ts`.
 */
import type { PolisReportData, ThemeSummary } from '$lib/types/report';
import type { PolisStatementAux } from '$lib/types/aux';
import { themeControversy } from './report';

/**
 * Summarise every theme worth showing in the Themes card: the **union** of the
 * conversation's theme dictionary and every theme actually applied to a statement.
 *
 * The union matters in both directions. Dictionary themes with no statements yet
 * must appear (at count 0) or a freshly created theme would silently vanish from
 * the card. Themes applied to statements but missing from the dictionary — legacy
 * free-text tags, or tags added by the comhairle UI's own insights view, which
 * writes the same column and has no dictionary — keep showing exactly as they did
 * before the dictionary existed. They are deliberately *not* distinguished here.
 *
 * Counts come from aux rows (not the Polis report) so pending/rejected statements
 * still count, matching what the Moderation table shows. Controversy needs vote
 * data, which only the report carries, so themes with no report coverage fall back
 * to 'low' — not surfaced today anyway (see ThemeBar).
 */
export function buildThemeSummaries(
	dictionary: Record<string, { description: string }>,
	auxByTid: Record<number, PolisStatementAux>,
	reportData: PolisReportData | null
): ThemeSummary[] {
	const counts = new Map<string, number>();
	// Seed every dictionary theme at 0 so unused ones still surface.
	for (const name of Object.keys(dictionary)) counts.set(name, 0);
	for (const row of Object.values(auxByTid)) {
		for (const t of row.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
	}

	return [...counts.entries()]
		.map(([theme, statementCount]) => ({
			theme,
			statementCount,
			controversy: reportData ? themeControversy(theme, reportData) : ('low' as const)
		}))
		.sort((a, b) => b.statementCount - a.statementCount);
}
