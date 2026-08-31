import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// The Place, from the subdomain. The Campaign is resolved one level down, in
	// `[campaign]/+layout.server.ts`, because that is where the slug lives.
	return { region: locals.region };
};
