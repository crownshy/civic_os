import { CONVERSATION_RESOURCE, cohostOrgIds } from '$lib/permissions';
import type { PageLoad } from './$types';

type PickerOrg = { id: string; name: string; website?: string | null; email?: string | null };

// A universal load on purpose. A server load that awaits `parent()` makes the
// server run the root and Campaign layouts again, about ten comhairle calls,
// every time someone opens Setup. Here `parent()` is the data the browser
// already holds.
export const load: PageLoad = async ({ parent, depends }) => {
	const { api, campaign, conversation } = await parent();
	const convId = campaign.id;
	depends(`cohosts:${convId}`);

	const [allOrgs, permissions] = await Promise.all([
		api
			.ListOrganizations({ queries: { limit: 200 } })
			.then((r) => r.records)
			.catch((e) => {
				console.warn('ListOrganizations failed', e);
				return [];
			}),
		api
			.ListResourcePermissions({
				params: { resource_type: CONVERSATION_RESOURCE, resource_id: convId },
				queries: { limit: 200 }
			})
			.then((r) => r.records)
			.catch((e) => {
				console.warn('ListResourcePermissions failed', e);
				return [];
			})
	]);
	const grantedOrgIds = cohostOrgIds(permissions, allOrgs);
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
	// `grantedOrgIds` too. Drop it there and let the owner row win, otherwise the
	// Host is listed twice and the keyed each block collides (#393).
	const cohosts = [
		...(owningOrgId ? [toCoHost(owningOrgId, true)] : []),
		...grantedOrgIds.filter((id) => id !== owningOrgId).map((id) => toCoHost(id, false))
	].filter((c): c is NonNullable<typeof c> => c != null);

	// Orgs already attached (owning + co-hosts) are excluded from the picker.
	const excludeIds = [owningOrgId, ...grantedOrgIds].filter((id): id is string => !!id);

	const pickerOrgs: PickerOrg[] = allOrgs.map((o) => ({
		id: o.id,
		name: o.name,
		website: o.externalUrl,
		email: o.contactEmail
	}));

	return { convId, owningOrgId, cohosts, pickerOrgs, excludeIds };
};
