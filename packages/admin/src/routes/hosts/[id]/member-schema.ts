import { z } from 'zod';
import type { OrganizationGroup, OrganizationTeamUserDto } from '@crownshy/api-client/api';

export type TeamRole = 'admin' | 'member';

/** Add-member form for a Host's team (AddOrganizationMember). */
export const addMemberSchema = z.object({
	// Trimmed and lowercased first: comhairle matches the address as sent, so
	// " Ana@Example.org" would otherwise reach a different account, or none.
	email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
	role: z.enum(['admin', 'member']).default('admin')
});

export type AddMemberSchema = typeof addMemberSchema;

/** superforms message from the add-member action. */
export type AddMemberMessage = {
	kind: 'ok' | 'error';
	text: string;
};

export function groupForRole(role: TeamRole): OrganizationGroup {
	return role === 'admin' ? 'admins' : 'members';
}

export type TeamMember = Pick<OrganizationTeamUserDto, 'id' | 'email' | 'username'> & {
	role: TeamRole;
};

/** Comhairle puts every admin in the members group too, so admins decides it. */
export function toTeamMember(user: OrganizationTeamUserDto): TeamMember {
	return {
		id: user.id,
		email: user.email,
		username: user.username,
		role: user.groups.includes('admins') ? 'admin' : 'member'
	};
}
