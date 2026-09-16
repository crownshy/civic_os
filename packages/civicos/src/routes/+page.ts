import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { campaignPath } from '@civicos/shared/data/place';
import { extractSubdomain } from '$lib/config/regions';
import { legacyRegionForSlug } from '$lib/config/campaign';
import type { PageLoad } from './$types';

/**
 * The site root.
 *
 * Nothing about the hostname picks a Campaign any more (ADR 0011), with one
 * exception kept for links already shared: production still serves
 * `utah.bloomproject.us`, `oregon.`, `testing.` and `all.`, and the root of each
 * always opened that region's Campaign. It still does. Any other host goes to
 * the Campaign configured for it when there is one (local dev, see
 * `scripts/seed-dev.sh`), and to the directory when there is not.
 */
export const load: PageLoad = ({ url }) => {
	const legacy = legacyRegionForSlug(extractSubdomain(url.hostname));
	if (legacy) redirect(307, campaignPath(legacy.slug, legacy.hostName));

	const configured = env.PUBLIC_CAMPAIGN_SLUG?.trim();
	if (configured) redirect(307, campaignPath(configured, ''));

	redirect(307, '/conversations');
};
