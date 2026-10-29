import { describe, expect, it } from 'vitest';
import type { UserOrganizationsResponse } from '@crownshy/api-client/api';
import { probeAdmin } from './admin-gate';

const httpError = (status: number) =>
	Object.assign(new Error(`HTTP ${status}`), { response: { status } });

type Org = UserOrganizationsResponse['organizations'][number];

const org = (isAssociated: boolean): Org =>
	({
		isAssociated,
		canUpdate: isAssociated,
		canDelete: false,
		canManageTeam: false,
		organization: { id: 'h1', name: 'Host' }
	}) as Org;

function api(regions: () => Promise<unknown>, orgs: () => Promise<unknown>) {
	return {
		ListRegions: regions,
		GetUserOrganizations: orgs
	} as unknown as Parameters<typeof probeAdmin>[0];
}

const refuseRegions = () => Promise.reject(httpError(401));
const unreachable = () => Promise.reject(new Error('should not be called'));

describe('probeAdmin', () => {
	it('lets a system admin in on /regions alone', async () => {
		expect(await probeAdmin(api(() => Promise.resolve({ records: [] }), unreachable))).toBe(
			'admin'
		);
	});

	it('lets a Host member in when /regions refuses them', async () => {
		const orgs = { canCreateOrganization: false, organizations: [org(true)] };
		expect(await probeAdmin(api(refuseRegions, () => Promise.resolve(orgs)))).toBe('admin');
	});

	it('denies a signed-in user who belongs to no Host', async () => {
		const orgs = { canCreateOrganization: false, organizations: [org(false)] };
		expect(await probeAdmin(api(refuseRegions, () => Promise.resolve(orgs)))).toBe('forbidden');
	});

	it('sends a logged-out user back to login', async () => {
		expect(await probeAdmin(api(refuseRegions, () => Promise.reject(httpError(401))))).toBe(
			'unauthorized'
		);
	});

	it('denies when membership cannot be read', async () => {
		expect(await probeAdmin(api(refuseRegions, () => Promise.reject(httpError(500))))).toBe(
			'forbidden'
		);
	});

	it('rethrows when comhairle is unreachable', async () => {
		await expect(
			probeAdmin(api(() => Promise.reject(new Error('ECONNREFUSED')), unreachable))
		).rejects.toThrow('ECONNREFUSED');
	});
});
