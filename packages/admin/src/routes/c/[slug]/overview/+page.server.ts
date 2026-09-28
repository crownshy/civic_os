import { fail } from '@sveltejs/kit';
import { createApiClient } from '$lib/api/client';
import { COHOST_ROLE, CONVERSATION_RESOURCE } from '$lib/permissions';
import { mirrorHosts } from '$lib/cohost-mirror';
import type { Actions, PageServerLoad } from './$types';

const STALE_PUBLIC_PAGE =
	'Saved, but the public Campaign page did not update. Add or remove a co-host to try again.';

/** "A", "A and B", "A, B and C". */
function listOf(names: string[]): string {
	return names.length < 2
		? (names[0] ?? '')
		: `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

type PickerOrg = { id: string; name: string; website?: string | null; email?: string | null };

export const load: PageServerLoad = async ({ parent, cookies, url, depends }) => {
	const { campaign, conversation } = await parent();
	const convId = campaign.id;
	depends(`cohosts:${convId}`);

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	const [allOrgs, cohostOrgIds] = await Promise.all([
		api
			.ListOrganizations({ queries: { limit: 200 } })
			.then((r) => r.records)
			.catch((e) => {
				console.warn('ListOrganizations failed', e);
				return [];
			}),
		// Co-host org ids = organizations granted the co-host role on this Conversation.
		api
			.ListResourcePermissions({
				params: { resource_type: CONVERSATION_RESOURCE, resource_id: convId },
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
			})
	]);
	const orgById = new Map(allOrgs.map((o) => [o.id, o]));

	const owningOrgId =
		(conversation as { organizationId?: string | null } | null)?.organizationId ?? null;

	const toCoHost = (id: string, isOwner: boolean) => {
		const o = orgById.get(id);
		if (!o) return null;
		return {
			id,
			name: o.name,
			website: o.externalUrl ?? undefined,
			email: o.contactEmail ?? undefined,
			isOwner
		};
	};

	// The owning Host also holds a `content_editor` grant, because ownership alone
	// does not make a Campaign visible to its own team, so it comes back in
	// `cohostOrgIds` too. Drop it there and let the owner row win, otherwise the
	// Host is listed twice and the keyed each block collides (#393).
	const cohosts = [
		...(owningOrgId ? [toCoHost(owningOrgId, true)] : []),
		...cohostOrgIds.filter((id) => id !== owningOrgId).map((id) => toCoHost(id, false))
	].filter((c): c is NonNullable<typeof c> => c != null);

	// Orgs already attached (owning + co-hosts) are excluded from the picker.
	const excludeIds = [owningOrgId, ...cohostOrgIds].filter((id): id is string => !!id);

	const pickerOrgs: PickerOrg[] = allOrgs.map((o) => ({
		id: o.id,
		name: o.name,
		website: o.externalUrl,
		email: o.contactEmail
	}));

	return { convId, owningOrgId, cohosts, pickerOrgs, excludeIds };
};

export const actions: Actions = {
	grantCohosts: async ({ request, cookies, url }) => {
		const fd = await request.formData();
		const convId = String(fd.get('convId') ?? '');
		const owningOrgId = String(fd.get('owningOrgId') ?? '') || null;
		const orgIds = fd.getAll('orgIds').map(String).filter(Boolean);
		const orgNames = fd.getAll('orgNames').map(String);
		if (!convId || orgIds.length === 0) return fail(400, { error: 'Select at least one host.' });

		const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
		const nameOf = (i: number) => orgNames[i] || 'a host';

		const added: string[] = [];
		const failed: string[] = [];
		for (const [i, organization_id] of orgIds.entries()) {
			try {
				await api.GrantPermission(
					{ organization_id, role_name: COHOST_ROLE, grant_reason: 'Co-host added via admin' },
					{ params: { resource_type: CONVERSATION_RESOURCE, resource_id: convId } }
				);
				added.push(nameOf(i));
			} catch (e) {
				console.error(`GrantPermission failed for ${organization_id}`, e);
				failed.push(nameOf(i));
			}
		}

		// civicos renders the "Hosted by" strip from this mirror, not from the
		// grants, which it cannot read. Mirrored whenever anything was granted, not
		// only when everything was: the grants that did land are live either way.
		const mirrored = added.length === 0 || (await mirrorHosts(api, convId, owningOrgId));

		if (failed.length) {
			const also = added.length ? ` Added ${listOf(added)}.` : '';
			return fail(400, {
				error: `Could not add ${listOf(failed)}.${also}`,
				changed: added.length > 0
			});
		}
		if (!mirrored) return { added: added.length, warning: STALE_PUBLIC_PAGE };
		return { added: added.length };
	},

	removeCohost: async ({ request, cookies, url }) => {
		const fd = await request.formData();
		const convId = String(fd.get('convId') ?? '');
		const owningOrgId = String(fd.get('owningOrgId') ?? '') || null;
		const orgId = String(fd.get('orgId') ?? '');
		if (!convId || !orgId) return fail(400, { error: 'Missing host.' });

		const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
		try {
			await api.RevokePermission(undefined, {
				params: { resource_type: CONVERSATION_RESOURCE, resource_id: convId },
				queries: { organization_id: orgId, role_name: COHOST_ROLE }
			});
			const mirrored = await mirrorHosts(api, convId, owningOrgId);
			return mirrored ? { removed: true } : { removed: true, warning: STALE_PUBLIC_PAGE };
		} catch (e) {
			console.error(`RevokePermission failed for ${orgId}`, e);
			return fail(400, { error: 'Could not remove co-host.' });
		}
	}
};
