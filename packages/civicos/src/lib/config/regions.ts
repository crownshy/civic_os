/**
 * Region configuration — civicos-side facade.
 *
 * Pure region data lives in `@civicos/shared/data/regions` (so admin can
 * consume the same single source of truth); this file re-exports it. It used
 * to overlay a `dev` region built from PUBLIC_DEV_* env vars, which pinned
 * every zip and every unknown subdomain to one local Conversation. Campaigns
 * come from the backend now, so local development runs against a real one and
 * the overlay is gone.
 */

import { REGIONS as BASE_REGIONS } from '@civicos/shared/data/regions';
import type { RegionConfig, Partner, FaqEntry } from '@civicos/shared/data/regions';

export type { RegionConfig, Partner, FaqEntry };
export {
	GENERIC_REGION,
	getRegionBySubdomain,
	getRegionByZipcode,
	extractSubdomain,
	getRegionUrl,
	getEventFullDescription,
	formatDurationLabel
} from '@civicos/shared/data/regions';

export const REGIONS: Record<string, RegionConfig> = BASE_REGIONS;
