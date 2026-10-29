import { redirect } from '@sveltejs/kit';
import { serverApi } from '@civicos/shared/api';
import { campaignPath } from '@civicos/shared/data/place';
import { listDirectory } from '$lib/config/directory';
import { extractSubdomain } from '$lib/config/regions';
import { legacyRegionForSlug } from '$lib/config/campaign';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, depends }) => {
	// Production still serves `utah.bloomproject.us`, `oregon.`, `testing.` and
	// `all.`, and links already shared expect the root of each to open that
	// region's Campaign (ADR 0011). Every other host gets the directory.
	const legacy = legacyRegionForSlug(extractSubdomain(url.hostname));
	if (legacy) redirect(307, campaignPath(legacy.slug));

	// A Host publishing a Campaign changes this list, so it needs a key an
	// invalidation can target.
	depends('civicos:directory');

	// Server-side and anonymous, like every other participant read: the proxy
	// forwards no token and `GET /conversation` does not want one.
	const api = serverApi(url);

	return {
		// `null` is "we could not ask", `[]` is "nothing is running", and the page
		// says different things for the two. This is where a 404 sends people, so
		// it must not 500 on top of the error that got them here.
		campaigns: await listDirectory(api)
	};
};
