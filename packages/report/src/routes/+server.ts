import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Reports live under /[slug]; the root belongs to the main site.
 *
 * Temporary by design: the destination is not settled, and a permanent
 * redirect would stay cached past any change to it.
 */
export const GET: RequestHandler = () => redirect(307, 'https://www.bloom-project.org/');
