import { error } from '@sveltejs/kit';
import { loadReport } from '$lib/reports';
import type { LayoutLoad } from './$types';

/**
 * A slug this build does not carry a report for is a 404, not a redirect.
 *
 * The report itself stays out of the returned data: see `loadedReport`.
 */
export const load: LayoutLoad = async ({ params }) => {
	const report = await loadReport(params.slug);
	if (!report) error(404, 'Report not found');
	return { slug: params.slug };
};
