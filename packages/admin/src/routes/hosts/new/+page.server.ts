import { error, fail, redirect } from '@sveltejs/kit';
import { createApiClient } from '$lib/api/client';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { hostDetailsSchema, toExternalUrl } from '$lib/hosts/host-details-schema';
import { fetchHostAccess } from '$lib/host-access';
import type { Actions, PageServerLoad } from './$types';

// Creating a Host stays with Super users; the rest of /hosts opened up in #454.
export const load: PageServerLoad = async ({ cookies, url, depends, parent }) => {
	depends('hosts:regions');
	const { hostAccess } = await parent();
	if (!hostAccess.all) redirect(303, '/hosts');

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	let regions: Array<{ id: string; name: string }> = [];
	try {
		const res = await api.ListRegions({ queries: { limit: 100 } });
		regions = res.records.map((r) => ({ id: r.id, name: r.name }));
	} catch (e) {
		console.warn('ListRegions failed', e);
	}

	const form = await superValidate(zod4(hostDetailsSchema));
	return { form, regions };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod4(hostDetailsSchema));
		// The field errors already say what is wrong, beside each field.
		if (!form.valid) return fail(400, { form });

		const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
		if (!(await fetchHostAccess(api)).all) error(403, 'Only Super users can create a Host.');
		// Trimmed here rather than in the schema; see `limitedText`.
		const { contactEmail, orgType, regionIds } = form.data;
		const name = form.data.name.trim();
		const description = form.data.description.trim();
		const externalUrl = toExternalUrl(form.data.website) || undefined;

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

		redirect(303, `/hosts?created=${encodeURIComponent(name)}`);
	}
};
