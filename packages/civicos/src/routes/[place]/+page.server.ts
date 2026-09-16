import { error, redirect } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import { campaignPath } from '@civicos/shared/data/place';
import { inPlace, listDirectory } from '$lib/config/directory';
import { legacyRegionForSlug } from '$lib/config/campaign';
import type { PageServerLoad } from './$types';

/**
 * A Place's page: the Campaigns running there (ADR 0011).
 *
 * It does the job the Place subdomain used to. A Place is still not a record
 * (ADR 0006), so there is nothing to look a slug up in: the page is the
 * directory filtered to the Campaigns whose Place has this slug, and a slug no
 * open Campaign carries has no page.
 */
export const load: PageServerLoad = async ({ params, url, depends }) => {
	// Same list as `/conversations`, so the same key invalidates both.
	depends('civicos:directory');

	const api = createApiClient(`${url.origin}/api`, undefined, 'server');
	const directory = await listDirectory(api);
	const campaigns = directory ? inPlace(directory, params.place) : [];
	const place = campaigns[0]?.place;

	if (place) return { placeName: place.name, campaigns };

	// `/utah` and `/oregon` opened their Campaign before this page existed, and
	// those links are still out there. A legacy Campaign that is closed or
	// unlisted has no card here, so the old link goes where it always went.
	const legacy = legacyRegionForSlug(params.place);
	if (legacy) redirect(307, campaignPath(legacy.slug, legacy.hostName));

	// "We could not ask" is not "nothing runs here". Say so on the page rather
	// than 404 a Place that may well exist.
	if (directory === null) return { placeName: params.place, campaigns: null };

	error(404, { message: `Nothing is running in "${params.place}" right now.` });
};
