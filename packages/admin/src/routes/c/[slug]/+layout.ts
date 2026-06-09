import { error } from '@sveltejs/kit';
import { REGIONS } from '@civicos/shared/data/regions';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params, parent }) => {
	const parentData = await parent();
	const region = REGIONS[params.slug];

	if (!region) {
		error(404, `Unknown conversation: ${params.slug}`);
	}

	return {
		...parentData,
		region
	};
};
