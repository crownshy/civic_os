import { createApiClient } from '@crownshy/api-client/client';
import { browser } from '$app/environment';
import { listCampaignSummaries } from '$lib/api/campaigns';
import type { CampaignSummary } from '$lib/types/campaign';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url, data, depends }) => {
	// Re-run this load (and rebuild the api client) when the session changes,
	// e.g. after login/logout call `invalidate('app:auth')`.
	depends('app:auth');
	depends('campaigns:list');

	// In the browser the api client authenticates via the cookie jar through the
	// /api proxy, so no token is needed. During SSR there is no cookie jar, so we
	// pass the httpOnly auth-token surfaced by +layout.server.ts.
	const authToken = browser ? undefined : data?.authToken;
	const api = createApiClient(url.origin + '/api', authToken, browser ? 'client' : 'server');
	
	let campaigns: CampaignSummary[] = [];
	let campaignsError: string | null = null;
	if (url.pathname !== '/login') {
		try {
			campaigns = await listCampaignSummaries(api);
		} catch (e) {
			campaignsError = e instanceof Error ? e.message : String(e);
			console.warn('listCampaignSummaries failed', campaignsError);
		}
	}

	return { api, campaigns, campaignsError };
};
