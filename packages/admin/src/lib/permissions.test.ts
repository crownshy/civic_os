import { describe, it, expect } from 'vitest';
import { COHOST_ROLE, cohostOrgIds } from './permissions';

const orgs = [
	{ id: 'org-a', userGroupId: 'group-a' },
	{ id: 'org-b', userGroupId: 'group-b' }
];

describe('cohostOrgIds', () => {
	it('resolves a group grant to the org that owns the group', () => {
		expect(cohostOrgIds([{ group_id: 'group-b', role_name: COHOST_ROLE }], orgs)).toEqual([
			'org-b'
		]);
	});

	it('still reads an org grant from a backend that reports organization_id', () => {
		expect(cohostOrgIds([{ organization_id: 'org-a', role_name: COHOST_ROLE }], orgs)).toEqual([
			'org-a'
		]);
	});

	it('ignores other roles, user grants and groups no org owns', () => {
		expect(
			cohostOrgIds(
				[
					{ group_id: 'group-a', role_name: 'owner' },
					{ role_name: COHOST_ROLE },
					{ group_id: 'group-unknown', role_name: COHOST_ROLE }
				],
				orgs
			)
		).toEqual([]);
	});

	it('lists an org once when it is granted twice', () => {
		expect(
			cohostOrgIds(
				[
					{ group_id: 'group-a', role_name: COHOST_ROLE },
					{ organization_id: 'org-a', role_name: COHOST_ROLE }
				],
				orgs
			)
		).toEqual(['org-a']);
	});
});
