import { error } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import { REGIONS } from '$lib/config/regions';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, cookies, url, depends }) => {
	depends(`region:conversation:${params.slug}`);

	const region = REGIONS[params.slug];
	if (!region) {
		error(404, `Unknown conversation: ${params.slug}`);
	}

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
	let conversation = null;
	try {
		conversation = await api.GetConversation({
			params: { conversation_id: region.conversationId }
		});
	} catch (e) {
		console.warn('GetConversation failed', e);
	}

	return { region, conversation };
};
