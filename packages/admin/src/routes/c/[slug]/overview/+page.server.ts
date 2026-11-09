import { fail } from '@sveltejs/kit';
import { COHOST_ROLE, CONVERSATION_RESOURCE } from '$lib/permissions';
import { STALE_PUBLIC_PAGE, mirrorHosts } from '$lib/cohost-mirror';
import type { Actions } from './$types';

/** "A", "A and B", "A, B and C". */
function listOf(names: string[]): string {
	return names.length < 2
		? (names[0] ?? '')
		: `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

export const actions: Actions = {
	grantCohosts: async ({ request, locals }) => {
		const fd = await request.formData();
		const convId = String(fd.get('convId') ?? '');
		const owningOrgId = String(fd.get('owningOrgId') ?? '') || null;
		const orgIds = fd.getAll('orgIds').map(String).filter(Boolean);
		const orgNames = fd.getAll('orgNames').map(String);
		if (!convId || orgIds.length === 0) return fail(400, { error: 'Select at least one host.' });

		const api = locals.api;
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

	removeCohost: async ({ request, locals }) => {
		const fd = await request.formData();
		const convId = String(fd.get('convId') ?? '');
		const owningOrgId = String(fd.get('owningOrgId') ?? '') || null;
		const orgId = String(fd.get('orgId') ?? '');
		if (!convId || !orgId) return fail(400, { error: 'Missing host.' });

		const api = locals.api;
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
