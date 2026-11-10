import type { UserDto, UserOrganizationsResponse } from '@crownshy/api-client/api';

/** Who is signed in to admin, as the sidebar footer shows it (#453). */
export type Viewer = {
	name: string;
	email: string | null;
	/** "Super user", or the role on their Host, e.g. "Admin · Bloom". Null when they have no Host. */
	role: string | null;
	/** The Host the user belongs to, for linking to its page. Null when they have none. */
	hostId: string | null;
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
	const email = user?.email?.trim() || null;
	const name = user?.username?.trim() || email || 'Signed in';
	const host = orgs?.organizations.find((o) => o.isAssociated);
	const hostId = host?.organization.id ?? null;
	if (orgs?.canCreateOrganization) return { name, email, role: 'Super user', hostId };

	if (!host) return { name, email, role: null, hostId: null };
	const role = `${host.canUpdate ? 'Admin' : 'Member'} · ${host.organization.name}`;
	return { name, email, role, hostId };
}
