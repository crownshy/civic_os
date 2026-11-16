import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/** Places are a Super user tool (ADR 0002, #404). Every action checks again. */
export const load: LayoutServerLoad = async ({ parent }) => {
	const { hostAccess } = await parent();
	if (!hostAccess.all) redirect(303, '/');
};
