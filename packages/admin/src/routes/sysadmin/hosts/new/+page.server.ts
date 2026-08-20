import { redirect } from '@sveltejs/kit';
import { createApiClient } from '$lib/api/client';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createHostSchema } from './create-host-schema';
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
		const { name, description, website, contactEmail, orgType, regionIds } = form.data;

		// Bare website -> external_url; add https:// when the user omitted a protocol.
		const externalUrl = website
			? /^https?:\/\//.test(website)
				? website
				: `https://${website}`
			: undefined;

		try {
			// mission is required by the API but absent from the design; send a
			// placeholder for now (tracked as a follow-up).
			await api.CreateOrganization({
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

		redirect(303, `/sysadmin/hosts?created=${encodeURIComponent(name)}`);
	}
};
