import type { PageServerLoad } from './$types';
import type { UserOrganizationAccess } from '@crownshy/api-client/api';

export const load: PageServerLoad = async ({ url, depends, parent }) => {
	depends('hosts:list');
	const { hostAccess } = await parent();

	const organizations: Array<UserOrganizationAccess> = hostAccess.hosts;

	return { organizations, created: url.searchParams.get('created') };
};
