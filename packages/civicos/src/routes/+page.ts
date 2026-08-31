import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { PageLoad } from './$types';

/**
 * The Place root. There is no index of the Campaigns in a Place (a Place is not
 * a record yet, see ADR 0006), so the one this redirects to is configured
 * rather than looked up.
 *
 * It redirects to the legacy single-segment shape on purpose: `[org]/+page.ts`
 * turns that into the canonical `/<org>/conversations/<slug>`, so the rule for
 * building that path lives in one place instead of two.
 */
export const load: PageLoad = async ({ parent }) => {
	const { region } = await parent();

	redirect(307, `/${env.PUBLIC_CAMPAIGN_SLUG || region.slug}`);
};
