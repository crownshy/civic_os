import { error, fail } from '@sveltejs/kit';
import { createApiClient } from '$lib/api/client';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { OrganizationTeamResponseDto } from '@crownshy/api-client/api';
import { addMemberSchema, groupForRole, toTeamMember } from './member-schema';
import { hostDetailsSchema, toExternalUrl, toWebsite } from '$lib/hosts/host-details-schema';
import { COHOST_ROLE, CONVERSATION_RESOURCE } from '$lib/permissions';
import { routeSlugFor, statusFor } from '$lib/conversations';
import { canManageHost, canViewHost, fetchHostAccess, type HostAccess } from '$lib/host-access';
import type { AssignableConversation, HostConversation } from './host-conversations';
import type { Actions, PageServerLoad } from './$types';

function client(url: URL, cookies: { get: (n: string) => string | undefined }) {
	return createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
}

/**
 * Host admins manage their own Host's details and team. Moving Campaigns between
 * Hosts stays with Super users: it hands one Host's work to another, with no undo.
 */
const canAssignCampaigns = (access: HostAccess) => access.all;

/** Form actions skip the layout gate, so each one checks for itself. */
async function requireAccess(
	api: ReturnType<typeof client>,
	allowed: (access: HostAccess) => boolean
) {
	if (!allowed(await fetchHostAccess(api))) error(403, 'You cannot change this Host.');
}

/**
 * The Campaigns this Host is attached to, split by how it is attached: the ones
 * it owns (`Conversation.organizationId`) and the ones it was granted co-host
 * access to (a `content_editor` grant on the Conversation resource). Also returns
 * the Campaigns that belong to nobody yet, which are the ones assignable here.
 *
 * Built from `GetPermittedConversations`, not `ListConverastions`: verified
 * against a local comhairle, `GET /conversation` returns only Campaigns with
 * `is_live: true` and ignores the `is_live` query param, so it hides every draft
 * and completed Campaign. Using it here would drop a Host's drafts from the list
 * and, worse, hide exactly the unowned drafts that most need assigning.
 *
 * It is also a list endpoint rather than per-id `GetConversation` calls because
 * only the list endpoints return display strings: on the single `ConversationDto`,
 * `title` and `description` are TextContentId UUIDs, not text.
 */
async function loadHostConversations(
	api: ReturnType<typeof client>,
	orgId: string
): Promise<{ attached: HostConversation[]; assignable: AssignableConversation[] }> {
	const [conversations, grants] = await Promise.all([
		api
			.GetPermittedConversations({ queries: { limit: 200 } })
			.then((r) => r.records)
			.catch((e) => {
				console.warn('GetPermittedConversations failed', e);
				return [];
			}),
		api
			.ListPermissions({
				queries: { organization_id: orgId, role_name: COHOST_ROLE, limit: 200 }
			})
			.then((r) => r.records)
			.catch((e) => {
				console.warn('ListPermissions failed', e);
				return [];
			})
	]);

	const cohostedIds = new Set(
		grants.filter((p) => p.resource_type === CONVERSATION_RESOURCE).map((p) => p.resource_id)
	);

	const attached = conversations
		.filter((c) => c.organizationId === orgId || cohostedIds.has(c.id))
		.map((c) => ({
			id: c.id,
			slug: routeSlugFor(c),
			title: c.title,
			status: statusFor(c),
			// Ownership wins the label: an org that owns a Campaign and also holds a
			// stray grant on it is still its Host, and its access is not revocable.
			access: c.organizationId === orgId ? ('owner' as const) : ('cohost' as const)
		}))
		.sort((a, b) => a.title.localeCompare(b.title));

	// Only unowned Campaigns are offered. Transferring one that already has a Host
	// is possible on the wire (a PUT with a different `organization_id` returns
	// 200) but it is deliberately not a two-click action: it takes a Campaign away
	// from another Host with no consent step and no audit trail.
	//
	// Assignment has NO UNDO. `{"organization_id": null}` comes back 422 ("Update
	// request contained no valid parameters") because the backend drops null
	// fields from an update, so a Campaign can never be returned to unowned. Only
	// offer Campaigns the Host really should get.
	const assignable = conversations
		.filter((c) => !c.organizationId)
		.map((c) => ({ id: c.id, title: c.title }))
		.sort((a, b) => a.title.localeCompare(b.title));

	return { attached, assignable };
}

export const load: PageServerLoad = async ({ params, cookies, url, depends, parent }) => {
	depends(`hosts:host:${params.id}`);
	const { hostAccess } = await parent();
	// The same 404 as a missing Host, so the page does not confirm which ids exist.
	if (!canViewHost(hostAccess, params.id)) error(404, 'Host not found');
	const api = client(url, cookies);

	const org = await api.GetOrganization({ params: { organization_id: params.id } }).catch((e) => {
		console.warn('GetOrganization failed', e);
		return null;
	});
	if (!org) error(404, 'Host not found');

	const [team, me, regions, conversations] = await Promise.all([
		api
			.GetOrganizationTeam({ params: { organization_id: params.id } })
			// Annotated because api-client 0.0.66-rc.0 types this endpoint as any.
			.then((r: OrganizationTeamResponseDto) => r.members.map(toTeamMember))
			.catch((e) => {
				console.warn('GetOrganizationTeam failed', e);
				return [];
			}),
		api.CurrentUser().catch(() => null),
		api
			.ListRegions({ queries: { limit: 100 } })
			.then((r) => r.records)
			.catch(() => []),
		loadHostConversations(api, params.id)
	]);

	// Resolve the org's region ids to names for display.
	const regionNames = new Map(regions.map((r) => [r.id, r.name]));
	const places = org.regions.map((id) => regionNames.get(id) ?? id);

	const details = {
		name: org.name,
		description: org.description,
		website: toWebsite(org.externalUrl),
		contactEmail: org.contactEmail ?? '',
		orgType: org.orgType,
		regionIds: org.regions
	};

	return {
		org: {
			id: org.id,
			name: org.name,
			description: org.description,
			externalUrl: org.externalUrl,
			contactEmail: org.contactEmail,
			places
		},
		team,
		conversations: conversations.attached,
		assignableConversations: canAssignCampaigns(hostAccess) ? conversations.assignable : [],
		currentUserId: me?.id ?? null,
		canManage: canManageHost(hostAccess, params.id),
		canAssign: canAssignCampaigns(hostAccess),
		form: await superValidate(zod4(addMemberSchema)),
		regions: regions.map((r) => ({ id: r.id, name: r.name })),
		detailsForm: await superValidate(details, zod4(hostDetailsSchema), {
			id: 'host-details',
			errors: false
		})
	};
};

export const actions: Actions = {
	/**
	 * Edit the Host's own details (#450).
	 *
	 * Checked against a local comhairle: description goes as plain text (the
	 * backend writes it to the Host's translation record), and an optional field
	 * is cleared with an empty string, because a null is dropped from the update
	 * and leaves the old value standing. Hence every field is always sent.
	 */
	updateHost: async ({ request, params, cookies, url }) => {
		await requireAccess(client(url, cookies), (a) => canManageHost(a, params.id));
		const form = await superValidate(request, zod4(hostDetailsSchema), { id: 'host-details' });
		if (!form.valid) return fail(400, { form });

		const { contactEmail, orgType, regionIds } = form.data;
		try {
			await client(url, cookies).UpdateOrganization(
				{
					name: form.data.name.trim(),
					description: form.data.description.trim(),
					external_url: toExternalUrl(form.data.website),
					contact_email: contactEmail,
					org_type: orgType,
					regions: regionIds
				},
				{ params: { organization_id: params.id } }
			);
		} catch (e) {
			console.error('UpdateOrganization failed', e);
			return message(
				form,
				{ kind: 'error', text: 'Could not save the Host details.' },
				{ status: 400 }
			);
		}
		return message(form, { kind: 'ok', text: 'Saved.' });
	},

	addMember: async ({ request, params, cookies, url }) => {
		const form = await superValidate(request, zod4(addMemberSchema));
		if (!form.valid) return fail(400, { form });

		const api = client(url, cookies);
		await requireAccess(api, (a) => canManageHost(a, params.id));
		try {
			const res = await api.AddOrganizationMember(
				{
					email: form.data.email,
					group: groupForRole(form.data.role),
					allow_create_user: true
				},
				{ params: { organization_id: params.id } }
			);
			const how = res.createdAccount ? 'account created' : 'existing account';
			const mail = res.emailed ? ', set-password email sent' : '';
			return message(form, {
				kind: 'ok',
				text: `${form.data.email} added (${how}${mail}).`
			});
		} catch (e) {
			console.error('AddOrganizationMember failed', e);
			return message(
				form,
				{ kind: 'error', text: `Could not add ${form.data.email}.` },
				{ status: 400 }
			);
		}
	},

	/**
	 * Give an unowned Campaign to this Host.
	 *
	 * `POST /conversation` silently drops `organization_id`, so a Campaign is born
	 * unowned and this PUT is the only thing that records an owner. Setting it
	 * fires a comhairle trigger that grants `observer` to the Host's members group
	 * and `admin` to its admins group, so the team sees it without a grant from us.
	 */
	assignCampaign: async ({ request, params, cookies, url }) => {
		const fd = await request.formData();
		const conversationId = String(fd.get('conversationId') ?? '');
		if (!conversationId) return fail(400, { error: 'Select a Campaign to assign.' });

		const api = client(url, cookies);
		await requireAccess(api, canAssignCampaigns);

		try {
			await api.UpdateConversation(
				{ organization_id: params.id },
				{ params: { conversation_id: conversationId } }
			);
		} catch (e) {
			console.error('UpdateConversation (assign owner) failed', e);
			return fail(400, { error: 'Could not assign that Campaign.' });
		}
		return { ok: true };
	},

	/**
	 * Drop a co-host grant. Only co-host access is revocable here: ownership is
	 * `Conversation.organizationId`, so removing it would mean reassigning the
	 * Campaign to another Host, which is a different (and unbuilt) operation.
	 */
	revokeAccess: async ({ request, params, cookies, url }) => {
		const fd = await request.formData();
		const conversationId = String(fd.get('conversationId') ?? '');
		if (!conversationId) return fail(400, { error: 'Missing conversation.' });

		const api = client(url, cookies);
		await requireAccess(api, canAssignCampaigns);
		try {
			await api.RevokePermission(undefined, {
				params: {
					resource_type: CONVERSATION_RESOURCE,
					resource_id: conversationId
				},
				queries: { organization_id: params.id, role_name: COHOST_ROLE }
			});
			return { ok: true };
		} catch (e) {
			console.error('RevokePermission failed', e);
			return fail(400, { error: 'Could not remove access.' });
		}
	},

	setRole: async ({ request, params, cookies, url }) => {
		const fd = await request.formData();
		const userId = String(fd.get('userId') ?? '');
		const role = String(fd.get('role') ?? '');
		if (role !== 'admin' && role !== 'member') return fail(400, { error: 'Invalid role' });

		const api = client(url, cookies);
		await requireAccess(api, (a) => canManageHost(a, params.id));
		// Guard: don't let a user demote themselves out of admin.
		const me = await api.CurrentUser().catch(() => null);
		if (me?.id === userId && role === 'member') {
			return fail(400, { error: "You can't remove your own admin role." });
		}

		// Roles are group memberships: admins is a subset of members, so demoting
		// means leaving the admins group, not joining members.
		const groupParams = {
			organization_id: params.id,
			group: groupForRole('admin'),
			user_id: userId
		};
		try {
			if (role === 'admin') {
				await api.AddOrganizationGroupMember(undefined, { params: groupParams });
			} else {
				await api.RemoveOrganizationGroupMember(undefined, { params: groupParams });
			}
			return { ok: true };
		} catch (e) {
			console.error('Updating organization admins group failed', e);
			return fail(400, { error: 'Could not update role.' });
		}
	},

	removeMember: async ({ request, params, cookies, url }) => {
		const fd = await request.formData();
		const userId = String(fd.get('userId') ?? '');

		const api = client(url, cookies);
		await requireAccess(api, (a) => canManageHost(a, params.id));
		// Guard: don't let a user remove themselves.
		const me = await api.CurrentUser().catch(() => null);
		if (me?.id === userId) return fail(400, { error: "You can't remove yourself." });

		try {
			await api.RemoveOrganizationMember(undefined, {
				params: { organization_id: params.id, user_id: userId }
			});
			return { ok: true };
		} catch (e) {
			console.error('RemoveOrganizationMember failed', e);
			return fail(400, { error: 'Could not remove member.' });
		}
	}
};
