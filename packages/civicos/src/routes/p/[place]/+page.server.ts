import { error } from '@sveltejs/kit';
import { serverApi } from '@civicos/shared/api';
import { inPlace, listDirectory } from '$lib/config/directory';
import type { PageServerLoad } from './$types';

/**
 * A Place's page at `/p/<slug>` (ADR 0019): the directory filtered to the
 * Campaigns filed under that Place. #579 swaps this for the Place's own areas
 * once comhairle can list Conversations by Region.
 */
export const load: PageServerLoad = async ({ params, url, depends }) => {
	// Same list as the site root, so the same invalidation key.
	depends('civicos:directory');

	const directory = await listDirectory(serverApi(url));
	if (directory === null) {
		error(503, {
			message: `We could not reach the service that knows about "${params.place}". Try again in a moment.`
		});
	}

	const campaigns = inPlace(directory, params.place);
	const place = campaigns[0]?.place;
	if (!place) error(404, { message: `There is no Place called "${params.place}".` });

	return { placeName: place.name, campaigns };
};
