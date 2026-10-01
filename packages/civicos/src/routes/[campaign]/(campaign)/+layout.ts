import { requireCampaign } from './require-campaign';
import type { LayoutLoad } from './$types';

/** Narrowed once here, so every universal load below reads `campaign` as present. */
export const load: LayoutLoad = async ({ parent, params }) =>
	requireCampaign(await parent(), params.campaign);
