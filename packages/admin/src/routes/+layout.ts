import { createApiClient } from '@crownshy/api-client/client';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
	const api = createApiClient(url.origin + '/api', undefined, browser ? 'client' : 'server');

	return { api };
};
