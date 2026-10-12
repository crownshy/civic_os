import { createApiClient } from '$lib/api/client';
import { canViewHost } from '$lib/host-access';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url, depends, parent }) => {
	depends('hosts:list');
	const { hostAccess } = await parent();

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	let organizations: Array<{
		id: string;
		name: string;
		externalUrl?: string | null;
		contactEmail?: string | null;
	}> = [];
	try {
		const res = await api.ListOrganizations({ queries: { limit: 100 } });
		// ListOrganizations returns every Host whoever asks; only a Super user sees them all.
		organizations = res.records
			.filter((o) => canViewHost(hostAccess, o.id))
			.map((o) => ({
				id: o.id,
				name: o.name,
				externalUrl: o.externalUrl,
				contactEmail: o.contactEmail
			}));
	} catch (e) {
		console.warn('ListOrganizations failed', e);
	}

	return { organizations, created: url.searchParams.get('created') };
};
