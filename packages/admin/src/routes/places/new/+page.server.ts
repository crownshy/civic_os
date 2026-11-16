import { error, fail, redirect } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { describeApiFailure } from '$lib/api/describe-failure';
import { fetchHostAccess } from '$lib/host-access';
import { placeMetadata, placeWithSlug } from '$lib/places';
import { createPlace, listPlaces, missingAreasMessage, resolveAreaIds } from '$lib/server/places';
import { placeSchema } from '../place-schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { form: await superValidate(zod4(placeSchema)) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(placeSchema));
		if (!form.valid) return fail(400, { form });

		const api = locals.api;
		if (!(await fetchHostAccess(api)).all) error(403, 'Only Super users can create a Place.');

		// Trimmed here rather than in the schema; see `limitedText`.
		const name = form.data.name.trim();
		const { slug } = placeMetadata(name);

		// Nothing in comhairle keeps Place slugs unique yet, so check here.
		let areaIds: string[];
		try {
			const taken = placeWithSlug(await listPlaces(api), slug);
			if (taken) {
				return setError(form, 'name', `"${taken.name}" already uses the slug "${slug}".`);
			}

			const resolved = await resolveAreaIds(api, form.data.areas);
			if (resolved.missing.length) {
				return setError(form, 'areas._errors', missingAreasMessage(resolved.missing));
			}
			areaIds = resolved.areaIds;
		} catch (e) {
			console.error('Checking a new Place failed', e);
			return message(
				form,
				{ kind: 'error', text: `Could not check the Place: ${describeApiFailure(e)}` },
				{ status: 400 }
			);
		}

		try {
			await createPlace(api, name, areaIds);
		} catch (e) {
			console.error('Creating a Place failed', e);
			return message(
				form,
				{ kind: 'error', text: `Could not create the Place: ${describeApiFailure(e)}` },
				{ status: 400 }
			);
		}

		redirect(303, `/places?created=${encodeURIComponent(name)}`);
	}
};
