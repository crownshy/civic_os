import { createApiClient } from '@crownshy/api-client/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url, depends }) => {
	depends('sysadmin:organizations');

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	let organizations: Array<{
		id: string;
		name: string;
		externalUrl?: string | null;
		contactEmail?: string | null;
	}> = [];
	try {
		const res = await api.ListOrganizations({ queries: { limit: 100 } });
		organizations = res.records.map((o) => ({
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
