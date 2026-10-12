import { describe, it, expect } from 'vitest';
import type { UserOrganizationsResponse } from '@crownshy/api-client/api';
import { canManageHost, canViewHost, hostsLink, ownableHosts, toHostAccess } from './host-access';

type Access = UserOrganizationsResponse['organizations'][number];

function org(id: string, access: { isAssociated: boolean; canUpdate: boolean }): Access {
	return {
		...access,
		canDelete: access.canUpdate,
		canManageTeam: access.canUpdate,
		organization: { id, name: id.toUpperCase() } as Access['organization']
	};
}

const orgs = (canCreateOrganization: boolean, organizations: Access[]) =>
	({ canCreateOrganization, organizations }) as UserOrganizationsResponse;

const elsewhere = org('other', { isAssociated: false, canUpdate: false });

describe('toHostAccess', () => {
	it('grants nothing when the call failed', () => {
		const access = toHostAccess(null);
		expect(access).toEqual({ all: false, hosts: [] });
		expect(hostsLink(access)).toBeNull();
	});

	it('gives a Super user every Host and the full list', () => {
		const access = toHostAccess(orgs(true, [elsewhere]));
		expect(canViewHost(access, 'other')).toBe(true);
		expect(canManageHost(access, 'other')).toBe(true);
		expect(hostsLink(access)).toEqual({ label: 'Hosts' });
	});

	it('limits everyone else to the Hosts they belong to', () => {
		const access = toHostAccess(
			orgs(false, [elsewhere, org('bloom', { isAssociated: true, canUpdate: true })])
		);
		expect(access.hosts.map((h) => h.id)).toEqual(['bloom']);
		expect(canViewHost(access, 'other')).toBe(false);
		expect(canManageHost(access, 'other')).toBe(false);
	});
});

describe('hostsLink', () => {
	it('takes a Host admin straight to their one Host', () => {
		const access = toHostAccess(
			orgs(false, [elsewhere, org('bloom', { isAssociated: true, canUpdate: true })])
		);
		expect(hostsLink(access)).toEqual({ label: 'My Host', hostId: 'bloom' });
		expect(canManageHost(access, 'bloom')).toBe(true);
	});

	it('hides the link from a member of a single Host, who can still open it read only', () => {
		const access = toHostAccess(
			orgs(false, [elsewhere, org('bloom', { isAssociated: true, canUpdate: false })])
		);
		expect(hostsLink(access)).toBeNull();
		expect(canViewHost(access, 'bloom')).toBe(true);
		expect(canManageHost(access, 'bloom')).toBe(false);
	});

	it('lists the Hosts of someone who belongs to more than one', () => {
		const access = toHostAccess(
			orgs(false, [
				org('bloom', { isAssociated: true, canUpdate: false }),
				org('crown', { isAssociated: true, canUpdate: false })
			])
		);
		expect(hostsLink(access)).toEqual({ label: 'My Hosts' });
	});
});

describe('ownableHosts', () => {
	const everyHost = [
		{ id: 'a', name: 'A' },
		{ id: 'b', name: 'B' }
	];

	it('offers a Super user every Host, even one they belong to none of', () => {
		expect(ownableHosts(orgs(true, []), everyHost)).toEqual(everyHost);
	});

	it('offers everyone else the Hosts they belong to or manage', () => {
		const mine = org('mine', { isAssociated: true, canUpdate: false });
		const managed = org('managed', { isAssociated: false, canUpdate: true });
		expect(ownableHosts(orgs(false, [mine, managed, elsewhere]), everyHost)).toEqual([
			{ id: 'mine', name: 'MINE' },
			{ id: 'managed', name: 'MANAGED' }
		]);
	});
});
