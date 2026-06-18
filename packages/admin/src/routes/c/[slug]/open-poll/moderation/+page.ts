import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { aux, auxError } = await parent();
	return { statements: aux, error: auxError };
};
