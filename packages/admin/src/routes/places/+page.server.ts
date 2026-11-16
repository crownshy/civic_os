import { describeApiFailure } from '$lib/api/describe-failure';
import { listPlaces } from '$lib/server/places';
import type { PlaceRecord } from '$lib/places';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	depends('places:list');

	let places: PlaceRecord[] = [];
	let loadError: string | null = null;
	try {
		places = await listPlaces(locals.api);
	} catch (e) {
		console.error('ListRegions failed', e);
		loadError = describeApiFailure(e);
	}

	return {
		places,
		loadError,
		created: url.searchParams.get('created'),
		deleted: url.searchParams.get('deleted')
	};
};
