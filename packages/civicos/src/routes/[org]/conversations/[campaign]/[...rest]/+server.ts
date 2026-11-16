import { redirect } from '@sveltejs/kit';
import { campaignPathFromLegacy } from '$lib/config/legacy-urls';
import type { RequestHandler } from './$types';

/**
 * The old `/<org>/conversations/<slug>/...` address, which is in emails and
 * shared posts (ADR 0014, ADR 0019). Permanent, because the new one is the
 * address for good. The query string goes along so a `?zip_code=` or a utm tag
 * survives.
 */
export const GET: RequestHandler = ({ params, url }) => {
	redirect(308, `${campaignPathFromLegacy(params.campaign, params.rest)}${url.search}`);
};
