import { redirect } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createHostSchema, parseEmailList, type MemberResult } from './create-host-schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url, depends }) => {
	depends('sysadmin:regions');

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	let regions: Array<{ id: string; name: string }> = [];
	try {
		const res = await api.ListRegions({ queries: { limit: 100 } });
		regions = res.records.map((r) => ({ id: r.id, name: r.name }));
	} catch (e) {
		console.warn('ListRegions failed', e);
	}

	const form = await superValidate(zod4(createHostSchema));
	return { form, regions };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod4(createHostSchema));
		if (!form.valid) return message(form, { kind: 'error', text: 'Please fix the errors below.' });

		const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
		const { name, description, website, contactEmail, orgType, regionIds, memberEmailsRaw } =
			form.data;

		// Bare website -> external_url; add https:// when the user omitted a protocol.
		const externalUrl = website
			? /^https?:\/\//.test(website)
				? website
				: `https://${website}`
			: undefined;

		let org: { id: string; name: string };
		try {
			// mission is required by the API but absent from the design; send a
			// placeholder for now (tracked as a follow-up). Member emails are NOT sent
			// in the create body (organization_admin_emails is being retired); they are
			// invited via AddOrganizationMember below.
			org = await api.CreateOrganization({
				name,
				description,
				mission: '',
				external_url: externalUrl,
				contact_email: contactEmail || undefined,
				org_type: orgType,
				regions: regionIds.length ? regionIds : undefined
			});
		} catch (e) {
			console.error('CreateOrganization failed', e);
			return message(
				form,
				{ kind: 'error', text: 'Could not create the Host. Please try again.' },
				{ status: 400 }
			);
		}

		// Invite each member email as an org admin. allow_create_user bootstraps an
		// account for unregistered emails and sends a set-password email. Failures do
		// not roll back the org (a Super user can add members later); we surface them.
		const emails = parseEmailList(memberEmailsRaw);
		const members: MemberResult[] = [];
		for (const email of emails) {
			try {
				const res = await api.AddOrganizationMember(
					{ email, role: 'admin', allow_create_user: true },
					{ params: { organization_id: org.id } }
				);
				members.push({ email, createdAccount: res.createdAccount, emailed: res.emailed });
			} catch (e) {
				console.error(`AddOrganizationMember failed for ${email}`, e);
				members.push({ email, error: 'Could not add this member.' });
			}
		}

		// If any member failed, stay on the form and show the per-email outcome so the
		// Super user can retry. Otherwise land on the Hosts list with a success banner.
		if (members.some((m) => m.error)) {
			return message(form, { kind: 'partial', orgName: name, members });
		}

		redirect(303, `/sysadmin/hosts?created=${encodeURIComponent(name)}`);
	}
};
