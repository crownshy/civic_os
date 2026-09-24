import { error, redirect } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import { campaignPath, readOrg } from '@civicos/shared/data/place';
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
 *
 * It is also the only root-level route with a parameter, so a one-segment URL
 * that names no Place lands here rather than anywhere it could be handled on
 * its own. That is what `campaignFor` below is doing: `/<conversation-slug>`
 * is the short address for a Campaign, and this is the only place SvelteKit
 * can resolve it from (one dynamic segment per level).
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

	// A Campaign answering to this slug. Place first, so a Host who names a
	// Campaign after its Place still gets the listing they published.
	const campaign = await campaignFor(api, params.place);
	// 307, not 308: the long path is canonical only until the Campaign page
	// moves to this one, and a permanent redirect would be cached past that.
	if (campaign) redirect(307, campaign);

	// "We could not ask" is not "nothing runs here". Say so on the page rather
	// than 404 a Place that may well exist.
	if (directory === null) return { placeName: params.place, campaigns: null };

	error(404, { message: `Nothing is running in "${params.place}" right now.` });
};

/**
 * The canonical path of the Campaign this slug names, or null for a slug that
 * names none.
 *
 * Asked of `GET /conversation/:idOrSlug` rather than of the directory already
 * in hand, because the directory lists only the Campaigns a stranger can walk
 * into. A Campaign that is live but unlisted still has a short link, and
 * someone sent one expects it to open rather than 404.
 *
 * Anything other than an answer is a miss: this runs after the Place lookup
 * has already failed, and the caller has a 404 and an outage page to fall
 * through to.
 */
async function campaignFor(
	api: ReturnType<typeof createApiClient>,
	slug: string
): Promise<string | null> {
	try {
		const conversation = await api.GetConversation({ params: { conversation_id: slug } });
		return campaignPath(conversation.slug ?? slug, readOrg(conversation.metadata)?.slug) || null;
	} catch {
		return null;
	}
}
