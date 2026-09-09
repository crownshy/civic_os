import { error } from '@sveltejs/kit';
import { THEME_BY_KEY } from '$lib/domain/bundled';
import type { PageLoad } from './$types';

/**
 * A theme key that does not exist is a 404 rather than a silent fall back to
 * the title page, so a broken link fails loudly instead of looking deliberate.
 */
export const load: PageLoad = ({ params }) => {
	const theme = THEME_BY_KEY.get(params.theme);
	if (!theme) error(404, `No theme "${params.theme}"`);
	return { theme };
};
