import { error } from '@sveltejs/kit';
import { REGIONS } from '$lib/config/regions';
import { fetchConversation } from '$lib/server/comhairle';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, cookies }) => {
	const region = REGIONS[params.slug];
	if (!region) {
		error(404, `Unknown conversation: ${params.slug}`);
	}

	const conversation = await fetchConversation(region.conversationId, cookies.get('auth-token'));

	return { region, conversation };
};
