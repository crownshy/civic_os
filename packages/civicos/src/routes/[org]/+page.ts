import { redirect } from '@sveltejs/kit';
import { campaignPath } from '@civicos/shared/data/place';
import type { PageLoad } from './$types';

/**
 * Legacy single-segment URLs, e.g. `utah.bloomproject.us/utah`.
 *
 * Campaigns used to live at `/<campaign-slug>`. They are now at
 * `/<org>/conversations/<campaign-slug>` (ADR 0007), which makes that old shape
 * match `[org]` with nothing after it. Utah and Oregon are live and their links
 * are in the wild, so this treats the lone segment as a Campaign slug and sends
 * it to the canonical address rather than 404ing on it.
 *
 * The Campaign is not resolved here: the `<org>` segment is decorative, so
 * `campaignPath` can fill it with its placeholder and the layout one level down
 * does the real lookup. Getting the Host's name into the URL would cost a
 * request on every legacy hit to make an ignored segment prettier.
 */
export const load: PageLoad = async ({ params }) => {
	redirect(308, campaignPath(params.org, ''));
};
