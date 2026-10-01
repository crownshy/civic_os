import { redirect } from '@sveltejs/kit';
import { CAMPAIGN_PAGES, campaignPath } from '@civicos/shared/data/place';
import type { RequestHandler } from './$types';

/**
 * Pages that were renamed when the Campaign moved to the root, keyed by their
 * old segment. Anything not here kept its name.
 */
const RENAMED: Record<string, string> = { contribute: CAMPAIGN_PAGES.poll };

/**
 * The old `/<org>/conversations/<slug>/...` address, which is in emails and
 * shared posts (ADR 0014). Permanent, because the new one is the address for
 * good. The query string goes along so a `?zip_code=` or a utm tag survives.
 */
export const GET: RequestHandler = ({ params, url }) => {
	const [page = '', ...rest] = params.rest.split('/');
	const renamed = Object.hasOwn(RENAMED, page) ? RENAMED[page] : page;

	redirect(308, `${campaignPath(params.campaign, renamed, ...rest)}${url.search}`);
};
