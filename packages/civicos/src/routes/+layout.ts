import { createApiClient } from '@civicos/shared/api';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';

export const load: LayoutLoad = async ({ url, data }) => {
	const api = createApiClient(url.origin + '/api', undefined, browser ? 'client' : 'server');

	return {
		api,
		participant: data.participant,
		participantResolved: data.participantResolved
	};
};
