import { fail } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import type { Actions, PageServerLoad } from './$types';

/**
 * The role granted to a co-host organization on a Campaign's Conversation.
 * `content_editor` (ConversationContentEditor) is currently the ONLY
 * Conversation-level role in comhairle, so it is what we grant. PROVISIONAL:
 * whether this role also propagates Campaign visibility to the co-host's members
 * (the #362 dashboard/homepage requirement) is unconfirmed with the backend. If a
 * dedicated co-host/steward role lands, change it here only.
 */
const COHOST_ROLE = 'content_editor';
const RESOURCE_TYPE = 'Conversation';

type PickerOrg = { id: string; name: string; website?: string | null; email?: string | null };

export const load: PageServerLoad = async ({ parent, cookies, url, depends }) => {
	const { region, conversation } = await parent();
	const convId = region.conversationId;
	depends(`cohosts:${convId}`);

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	const allOrgs = await api
		.ListOrganizations({ queries: { limit: 200 } })
		.then((r) => r.records)
		.catch((e) => {
			console.warn('ListOrganizations failed', e);
			return [];
		});
	const orgById = new Map(allOrgs.map((o) => [o.id, o]));

	// Co-host org ids = organizations granted the co-host role on this Conversation.
	const cohostOrgIds = await api
		.ListResourcePermissions({
			params: { resource_type: RESOURCE_TYPE, resource_id: convId },
			queries: { limit: 200 }
		})
		.then((r) =>
			r.records
				.filter((p) => p.organization_id && p.role_name === COHOST_ROLE)
				.map((p) => p.organization_id as string)
		)
		.catch((e) => {
			console.warn('ListResourcePermissions failed', e);
			return [] as string[];
		});

	const owningOrgId = (conversation as { organizationId?: string | null } | null)?.organizationId ?? null;

	const toCoHost = (id: string, isAdmin: boolean) => {
		const o = orgById.get(id);
		if (!o) return null;
		return {
			id,
			name: o.name,
			website: o.externalUrl ?? undefined,
			email: o.contactEmail ?? undefined,
			isAdmin
		};
	};

	const cohosts = [
		...(owningOrgId ? [toCoHost(owningOrgId, true)] : []),
		...cohostOrgIds.map((id) => toCoHost(id, false))
	].filter((c): c is NonNullable<typeof c> => c != null);

	// Orgs already attached (owning + co-hosts) are excluded from the picker.
	const excludeIds = [owningOrgId, ...cohostOrgIds].filter((id): id is string => !!id);

	const pickerOrgs: PickerOrg[] = allOrgs.map((o) => ({
		id: o.id,
		name: o.name,
		website: o.externalUrl,
		email: o.contactEmail
	}));

	return { convId, cohosts, pickerOrgs, excludeIds };
};

export const actions: Actions = {
	grantCohosts: async ({ request, cookies, url }) => {
		const fd = await request.formData();
		const convId = String(fd.get('convId') ?? '');
		const orgIds = fd.getAll('orgIds').map(String).filter(Boolean);
		if (!convId || orgIds.length === 0) return fail(400, { error: 'Select at least one host.' });

		const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

		const failures: string[] = [];
		for (const organization_id of orgIds) {
			try {
				await api.GrantPermission(
					{ organization_id, role_name: COHOST_ROLE, grant_reason: 'Co-host added via admin' },
					{ params: { resource_type: RESOURCE_TYPE, resource_id: convId } }
				);
			} catch (e) {
				console.error(`GrantPermission failed for ${organization_id}`, e);
				failures.push(organization_id);
			}
		}

		if (failures.length) return fail(400, { error: `Could not add ${failures.length} host(s).` });
		return { added: orgIds.length };
	},

	removeCohost: async ({ request, cookies, url }) => {
		const fd = await request.formData();
		const convId = String(fd.get('convId') ?? '');
		const orgId = String(fd.get('orgId') ?? '');
		if (!convId || !orgId) return fail(400, { error: 'Missing host.' });

		const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
		try {
			await api.RevokePermission(undefined, {
				params: { resource_type: RESOURCE_TYPE, resource_id: convId },
				queries: { organization_id: orgId, role_name: COHOST_ROLE }
			});
			return { removed: true };
		} catch (e) {
			console.error(`RevokePermission failed for ${orgId}`, e);
			return fail(400, { error: 'Could not remove co-host.' });
		}
	}
};
