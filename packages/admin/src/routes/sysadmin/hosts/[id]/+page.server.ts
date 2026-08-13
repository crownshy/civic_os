import { error, fail } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { addMemberSchema } from './member-schema';
import type { Actions, PageServerLoad } from './$types';

function client(url: URL, cookies: { get: (n: string) => string | undefined }) {
	return createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
}

export const load: PageServerLoad = async ({ params, cookies, url, depends }) => {
	depends(`sysadmin:host:${params.id}`);
	const api = client(url, cookies);

	const org = await api.GetOrganization({ params: { organization_id: params.id } }).catch((e) => {
		console.warn('GetOrganization failed', e);
		return null;
	});
	if (!org) error(404, 'Host not found');

	const [team, me, regions] = await Promise.all([
		api
			.GetOrganizationTeam({ params: { organization_id: params.id } })
			.then((r) => r.members)
			.catch((e) => {
				console.warn('GetOrganizationTeam failed', e);
				return [];
			}),
		api.CurrentUser().catch(() => null),
		api
			.ListRegions({ queries: { limit: 100 } })
			.then((r) => r.records)
			.catch(() => [])
	]);

	// Resolve the org's region ids to names for display.
	const regionNames = new Map(regions.map((r) => [r.id, r.name]));
	const places = org.regions.map((id) => regionNames.get(id) ?? id);

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
		currentUserId: me?.id ?? null,
		form: await superValidate(zod4(addMemberSchema))
	};
};

export const actions: Actions = {
	addMember: async ({ request, params, cookies, url }) => {
		const form = await superValidate(request, zod4(addMemberSchema));
		if (!form.valid) return message(form, { kind: 'error', text: 'Please fix the errors below.' });

		const api = client(url, cookies);
		try {
			const res = await api.AddOrganizationMember(
				{ email: form.data.email, role: form.data.role, allow_create_user: true },
				{ params: { organization_id: params.id } }
			);
			const how = res.createdAccount ? 'account created' : 'existing account';
			const mail = res.emailed ? ', set-password email sent' : '';
			return message(form, { kind: 'ok', text: `${form.data.email} added (${how}${mail}).` });
		} catch (e) {
			console.error('AddOrganizationMember failed', e);
			return message(
				form,
				{ kind: 'error', text: `Could not add ${form.data.email}.` },
				{ status: 400 }
			);
		}
	},

	setRole: async ({ request, params, cookies, url }) => {
		const fd = await request.formData();
		const userId = String(fd.get('userId') ?? '');
		const role = String(fd.get('role') ?? '');
		if (role !== 'admin' && role !== 'member') return fail(400, { error: 'Invalid role' });

		const api = client(url, cookies);
		// Guard: don't let a user demote themselves out of admin.
		const me = await api.CurrentUser().catch(() => null);
		if (me?.id === userId && role === 'member') {
			return fail(400, { error: "You can't remove your own admin role." });
		}

		try {
			await api.UpdateOrganizationMemberRole(
				{ role },
				{ params: { organization_id: params.id, user_id: userId } }
			);
			return { ok: true };
		} catch (e) {
			console.error('UpdateOrganizationMemberRole failed', e);
			return fail(400, { error: 'Could not update role.' });
		}
	},

	removeMember: async ({ request, params, cookies, url }) => {
		const fd = await request.formData();
		const userId = String(fd.get('userId') ?? '');

		const api = client(url, cookies);
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
