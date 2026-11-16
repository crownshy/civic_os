import { redirect } from '@sveltejs/kit';
import { serverApi } from '@civicos/shared/api';
import { pathFromLegacyRoot } from '$lib/config/legacy-urls';
import type { RequestHandler } from './$types';

/**
 * The root-level `/<slug>/...` addresses from before Campaigns moved under
 * `/c/` and Places under `/p/` (ADR 0019). They are in emails and shared
 * posts, so the redirect is permanent and keeps the query string, which is
 * where a `?zip_code=` or a utm tag rides.
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const path = await pathFromLegacyRoot(serverApi(url), params.slug, params.rest);

	redirect(308, `${path}${url.search}`);
};
