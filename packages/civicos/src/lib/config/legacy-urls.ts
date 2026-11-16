import type { ApiClient } from '@crownshy/api-client/api';
import { CAMPAIGN_PAGES, campaignPath, placePath } from '@civicos/shared/data/place';
import { httpStatusOf } from '$lib/utils/http';
import { campaignCandidates, legacyRegionForSlug } from './campaign';
import { inPlace, listDirectory } from './directory';

/** Pages renamed since the old URLs went out, keyed by their old segment. */
const RENAMED_PAGES: Record<string, string> = { contribute: CAMPAIGN_PAGES.poll };

/**
 * Where an old Campaign link now lives: `/c/<slug>/<page>/...`, with a renamed
 * page mapped to its new name. `rest` is the part after the slug, `a/b`.
 */
export function campaignPathFromLegacy(slug: string, rest: string): string {
	const [page = '', ...more] = rest.split('/');
	const renamed = Object.hasOwn(RENAMED_PAGES, page) ? RENAMED_PAGES[page] : page;

	return campaignPath(slug, renamed, ...more);
}

type LookupApi = Pick<ApiClient, 'GetConversation' | 'ListConverastions'>;

/**
 * Whether comhairle knows a Campaign by this slug. A draft (401 or 403) counts,
 * since `/c/<slug>` is where its Host previews it. So does an outage: the
 * Campaign page is what explains one.
 */
async function namesCampaign(api: LookupApi, slug: string): Promise<boolean> {
	for (const candidate of campaignCandidates(slug)) {
		try {
			await api.GetConversation({ params: { conversation_id: candidate } });
			return true;
		} catch (e) {
			if (httpStatusOf(e) !== 404) return true;
		}
	}
	return false;
}

/**
 * Where an old root URL, `/<slug>/...`, now lives (ADR 0019). Before the
 * prefixes a lone slug named a Campaign first and a Place second, so that is
 * the order it is resolved in here. Anything with a page after the slug was a
 * Campaign, since a Place never had pages.
 */
export async function pathFromLegacyRoot(
	api: LookupApi,
	slug: string,
	rest: string
): Promise<string> {
	if (rest || legacyRegionForSlug(slug)) return campaignPathFromLegacy(slug, rest);
	if (await namesCampaign(api, slug)) return campaignPath(slug);

	const directory = await listDirectory(api);
	if (directory && inPlace(directory, slug).length > 0) return placePath(slug);

	// Nothing answers to it. `/c/<slug>` is where the 404 is explained.
	return campaignPath(slug);
}
