import type { UserDto, UserOrganizationsResponse } from '@crownshy/api-client/api';

/** Who is signed in to admin, as the sidebar footer shows it (#453). */
export type Viewer = {
	name: string;
	/** "Super user", or the role on their Host, e.g. "Admin · Bloom". Null when they have no Host. */
	role: string | null;
};

/**
 * GetUserOrganizations lists every Host, flagging the one the user belongs to
 * with `isAssociated` (comhairle keeps a single organization per user). A Host
 * admin is the OrganizationAdmin grant, which is exactly what `canUpdate` reports.
 */
export function toViewer(
	user: Pick<UserDto, 'username' | 'email'> | null,
	orgs: UserOrganizationsResponse | null
): Viewer {
	const name = user?.username?.trim() || user?.email?.trim() || 'Signed in';
	if (orgs?.canCreateOrganization) return { name, role: 'Super user' };

	const host = orgs?.organizations.find((o) => o.isAssociated);
	if (!host) return { name, role: null };
	return { name, role: `${host.canUpdate ? 'Admin' : 'Member'} · ${host.organization.name}` };
}
