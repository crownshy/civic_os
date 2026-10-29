import { joinContextFor } from '$lib/services/join';
import { requireCampaign } from './require-campaign';
import type { LayoutLoad } from './$types';

/**
 * Narrowed once here, so every universal load below reads `campaign` as present.
 * `joinContext` is rebuilt rather than passed through because the narrowing
 * cannot see that the parent only set it for a Campaign.
 */
export const load: LayoutLoad = async ({ parent, params }) => {
	const data = requireCampaign(await parent(), params.campaign);
	return { ...data, joinContext: joinContextFor(data) };
};
