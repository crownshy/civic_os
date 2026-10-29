import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * The directory moved to the site root (#537). `/conversations` is in emails,
 * host copy and the regions.ts "what's next" text, so it redirects for good and
 * keeps the query string, which is where those links carry their utm tags.
 */
export const GET: RequestHandler = ({ url }) => {
	redirect(308, `/${url.search}`);
};
