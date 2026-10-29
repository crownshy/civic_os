import type { UserOrganizationsResponse } from '@crownshy/api-client/api';
import type { Api } from '@civicos/shared/api';

/**
 * Which Host pages the signed-in user may open, and what they may do there (#454).
 *
 * A Super user sees every Host. Everyone else sees only the Hosts they belong to,
 * and manages the ones where they are an admin. `GetUserOrganizations` lists every
 * Host and flags the caller's with `isAssociated`; `canUpdate` is the
 * OrganizationAdmin grant.
 */
export type HostAccess = {
	/** Sees and manages every Host, and is the only one who may create one. */
	all: boolean;
	/** Hosts the user belongs to. Empty for a Super user, who sees all of them anyway. */
	hosts: Array<{ id: string; name: string; isAdmin: boolean }>;
};

export const NO_HOST_ACCESS: HostAccess = { all: false, hosts: [] };

export function toHostAccess(orgs: UserOrganizationsResponse | null): HostAccess {
	if (!orgs) return NO_HOST_ACCESS;
	if (orgs.canCreateOrganization) return { all: true, hosts: [] };
	return {
		all: false,
		hosts: orgs.organizations
			.filter((o) => o.isAssociated)
			.map((o) => ({ id: o.organization.id, name: o.organization.name, isAdmin: o.canUpdate }))
	};
}

/**
 * For form actions, which run without the layout loads and so cannot read
 * `hostAccess` through `parent()`. A failed call grants nothing.
 */
export async function fetchHostAccess(api: Pick<Api, 'GetUserOrganizations'>): Promise<HostAccess> {
	return toHostAccess(await api.GetUserOrganizations().catch(() => null));
}

export function canViewHost(access: HostAccess, hostId: string): boolean {
	return access.all || access.hosts.some((h) => h.id === hostId);
}

export function canManageHost(access: HostAccess, hostId: string): boolean {
	return access.all || access.hosts.some((h) => h.id === hostId && h.isAdmin);
}

/** `hostId` set means link straight to that Host rather than to the list. */
export type HostsLink = { label: string; hostId?: string };

/**
 * The sidebar's Hosts link, or null when it would not help. A plain member of a
 * single Host gets nothing: a list with one row adds a click, and there is
 * nothing on the Host page they can change. An admin of a single Host goes
 * straight to it, since that page is where they manage their team.
 */
export function hostsLink(access: HostAccess): HostsLink | null {
	if (access.all) return { label: 'Hosts' };
	const [only, ...rest] = access.hosts;
	if (!only) return null;
	if (rest.length) return { label: 'My Hosts' };
	return only.isAdmin ? { label: 'My Host', hostId: only.id } : null;
}

export type HostOption = { id: string; name: string };

/**
 * The Hosts the caller may make the owner of a new Campaign. A Super user may
 * pick any Host on BLOOM, so they get `everyHost` (ListOrganizations) rather
 * than the subset GetUserOrganizations happens to flag, which for a Super user
 * who belongs to no Host can be empty.
 */
export function ownableHosts(
	orgs: UserOrganizationsResponse,
	everyHost: HostOption[]
): HostOption[] {
	if (orgs.canCreateOrganization) return everyHost;
	return orgs.organizations
		.filter((o) => o.canUpdate || o.isAssociated)
		.map((o) => ({ id: o.organization.id, name: o.organization.name }));
}
