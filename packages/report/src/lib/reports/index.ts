import type { Report } from '../domain/report';

/**
 * The reports this build serves, by the slug they publish at. Each is imported
 * on demand so a visitor only downloads the one they asked for.
 *
 * Comhairle conversation slugs are globally unique, so once reports stop
 * carrying their own bundled data this becomes a lookup there
 * (GET /conversation/{id_or_slug} already accepts a slug) rather than a table.
 */
const REPORTS: Record<string, () => Promise<{ report: Report }>> = {
	'central-oregon-ai': () => import('./central-oregon-ai')
};

const loaded = new Map<string, Report>();

export const REPORT_SLUGS = Object.keys(REPORTS);

/** Loads a report's module, or null if this build does not carry that slug. */
export async function loadReport(slug: string): Promise<Report | null> {
	const cached = loaded.get(slug);
	if (cached) return cached;

	const load = REPORTS[slug];
	if (!load) return null;

	const { report } = await load();
	loaded.set(slug, report);
	return report;
}

/**
 * The already-loaded report, for the layout that renders it.
 *
 * A report is a few hundred KB of statements, and `load` returning it would
 * put a copy in the page's serialized data on top of the copy already in its
 * module. So `load` awaits it for its side effect and hands on the slug, and
 * the layout reads the module back out synchronously here.
 */
export function loadedReport(slug: string): Report {
	const report = loaded.get(slug);
	if (!report) throw new Error(`Report "${slug}" has not been loaded`);
	return report;
}
