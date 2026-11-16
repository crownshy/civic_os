import { error, fail, redirect } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Api } from '@civicos/shared/api';
import { describeApiFailure } from '$lib/api/describe-failure';
import { fetchHostAccess } from '$lib/host-access';
import { placeMetadata, placeWithSlug } from '$lib/places';
import {
	getPlace,
	listPlaces,
	missingAreasMessage,
	resolveAreaIds,
	updatePlace
} from '$lib/server/places';
import { placeSchema } from '../place-schema';
import type { Actions, PageServerLoad } from './$types';

async function requireSuperUser(api: Api) {
	if (!(await fetchHostAccess(api)).all) error(403, 'Only Super users can change a Place.');
}

export const load: PageServerLoad = async ({ locals, params, depends }) => {
	depends(`places:${params.id}`);

	const place = await getPlace(locals.api, params.id);
	const form = await superValidate({ name: place.name, areas: place.areas }, zod4(placeSchema), {
		errors: false
	});

	return { place, form };
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		const form = await superValidate(request, zod4(placeSchema));
		if (!form.valid) return fail(400, { form });

		const api = locals.api;
		await requireSuperUser(api);
		const place = await getPlace(api, params.id);

		const name = form.data.name.trim();
		const { slug } = placeMetadata(name);

		try {
			const taken = placeWithSlug(await listPlaces(api), slug, place.id);
			if (taken) {
				return setError(form, 'name', `"${taken.name}" already uses the slug "${slug}".`);
			}

			const { areaIds, missing } = await resolveAreaIds(api, form.data.areas);
			if (missing.length) return setError(form, 'areas._errors', missingAreasMessage(missing));

			await updatePlace(api, place, name, areaIds);
		} catch (e) {
			console.error('Saving a Place failed', e);
			return message(
				form,
				{ kind: 'error', text: `Could not save the Place: ${describeApiFailure(e)}` },
				{ status: 400 }
			);
		}

		return { form };
	},

	delete: async ({ locals, params }) => {
		const api = locals.api;
		await requireSuperUser(api);
		const place = await getPlace(api, params.id);

		try {
			await api.DeleteRegion(undefined, { params: { region_id: place.id } });
		} catch (e) {
			console.error('DeleteRegion failed', e);
			// A Host or workflow still pointing at the Region refuses the delete.
			return fail(400, { deleteError: `Could not delete the Place: ${describeApiFailure(e)}` });
		}

		redirect(303, `/places?deleted=${encodeURIComponent(place.name)}`);
	}
};
