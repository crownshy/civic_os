import type { PageLoad } from './$types';

// The events list is loaded by the parent `events` layout (`events:list`); expose
// it as page data so this page can keep reading `data.events`.
export const load: PageLoad = async ({ parent }) => {
	const { events } = await parent();
	return { events };
};
