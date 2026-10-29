import { describe, expect, it } from 'vitest';
import { addMemberSchema, groupForRole, toTeamMember } from './member-schema';

describe('toTeamMember', () => {
	const user = { id: 'u1', email: 'ana@example.org', username: 'ana' };

	it('is an admin when in the admins group', () => {
		expect(toTeamMember({ ...user, groups: ['members', 'admins'] }).role).toBe('admin');
	});

	it('is a member when only in the members group', () => {
		expect(toTeamMember({ ...user, groups: ['members'] }).role).toBe('member');
	});
});

describe('groupForRole', () => {
	it('maps the form role to its comhairle group', () => {
		expect(groupForRole('admin')).toBe('admins');
		expect(groupForRole('member')).toBe('members');
	});
});

describe('addMemberSchema', () => {
	it('trims and lowercases the email before it is sent', () => {
		expect(addMemberSchema.parse({ email: '  Ana@Example.ORG ' }).email).toBe('ana@example.org');
	});

	it('still refuses something that is not an email', () => {
		expect(addMemberSchema.safeParse({ email: 'not an email' }).success).toBe(false);
	});
});
