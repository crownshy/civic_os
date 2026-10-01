import { describe, it, expect } from 'vitest';
import type { UserOrganizationsResponse } from '@crownshy/api-client/api';
import { toViewer } from './viewer';

function org(name: string, access: { isAssociated: boolean; canUpdate: boolean }) {
	return {
		...access,
		canDelete: access.canUpdate,
		canManageTeam: access.canUpdate,
		organization: { name } as UserOrganizationsResponse['organizations'][number]['organization']
	};
}

const orgs = (
	canCreateOrganization: boolean,
	organizations: ReturnType<typeof org>[]
): UserOrganizationsResponse => ({ canCreateOrganization, organizations });

describe('toViewer', () => {
	it('names the user by username, then email', () => {
		expect(toViewer({ username: 'Ada', email: 'ada@x.org' }, null).name).toBe('Ada');
		expect(toViewer({ username: null, email: 'ada@x.org' }, null).name).toBe('ada@x.org');
		expect(toViewer(null, null).name).toBe('Signed in');
	});

	it('shows Super user whatever Host the user is on', () => {
		const res = orgs(true, [org('Bloom', { isAssociated: true, canUpdate: true })]);
		expect(toViewer(null, res).role).toBe('Super user');
	});

	it('reads the role on the Host the user belongs to, not the others listed', () => {
		const res = orgs(false, [
			org('Other', { isAssociated: false, canUpdate: false }),
			org('Bloom', { isAssociated: true, canUpdate: true })
		]);
		expect(toViewer(null, res).role).toBe('Admin · Bloom');

		res.organizations[1].canUpdate = false;
		expect(toViewer(null, res).role).toBe('Member · Bloom');
	});

	it('has no role when the user belongs to no Host', () => {
		const res = orgs(false, [org('Other', { isAssociated: false, canUpdate: false })]);
		expect(toViewer(null, res).role).toBeNull();
	});
});
