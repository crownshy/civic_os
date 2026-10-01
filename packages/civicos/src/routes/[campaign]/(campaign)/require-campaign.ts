import { error } from '@sveltejs/kit';
import type { LayoutServerData } from '../$types';

/** What the `[campaign]` layout answers when the slug names a Campaign. */
type CampaignData = Extract<LayoutServerData, { kind: 'campaign' }>;

/**
 * The parent data, narrowed to a Campaign, or a 404 for a Place.
 *
 * The pages in this group only exist for a Campaign, but `/<place>/poll` still
 * reaches them when the slug names a Place. Server loads read the server
 * layout's data rather than `+layout.ts`'s, so each kind of load narrows here.
 */
export function requireCampaign<T extends { kind: string }>(
	data: T,
	slug: string
): Omit<T, keyof CampaignData> & CampaignData {
	if (data.kind !== 'campaign') error(404, { message: `There is no Campaign called "${slug}".` });

	return data as unknown as Omit<T, keyof CampaignData> & CampaignData;
}
