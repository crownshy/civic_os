import { createApiClient } from '@crownshy/api-client/client';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';

export const load: LayoutLoad = async ({ url, data }) => {
	const api = createApiClient(url.origin + '/api', undefined, browser ? 'client' : 'server');

	return { api, region: data.region };
};
