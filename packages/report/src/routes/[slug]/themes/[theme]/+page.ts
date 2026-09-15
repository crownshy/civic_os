import { error } from '@sveltejs/kit';
import { loadedReport } from '$lib/reports';
import type { PageLoad } from './$types';

/**
 * A theme key that does not exist is a 404 rather than a silent fall back to
 * the title page, so a broken link fails loudly instead of looking deliberate.
 */
export const load: PageLoad = async ({ params, parent }) => {
	const { slug } = await parent();
	const theme = loadedReport(slug).themeByKey.get(params.theme);
	if (!theme) error(404, `No theme "${params.theme}"`);
	return { theme };
};
