import { createApiClient } from '@crownshy/api-client/client';
import { env } from '$env/dynamic/public';

export const api = createApiClient('/api', undefined, 'client');

export const config = {
	conversationId: env.PUBLIC_CONVERSATION_ID || '',
	inviteId: env.PUBLIC_INVITE_ID || '',
	polisUrl: env.PUBLIC_POLIS_URL || 'https://polis.comhairle.scot',
	polisId: env.PUBLIC_POLIS_ID || '3itaahejzh'
};

/** Per-region Polis ID overrides from env vars */
const regionPolisIds: Record<string, string> = {
	utah: env.PUBLIC_POLIS_ID_UTAH || '',
	oregon: env.PUBLIC_POLIS_ID_OREGON || '',
	generic: env.PUBLIC_POLIS_ID_GENERIC || ''
};

/**
 * Resolve the Polis ID for a given region slug.
 * Falls back to the region's built-in polisId, then to the global config.polisId.
 */
export function getPolisIdForRegion(regionSlug: string, regionDefaultPolisId: string): string {
	return regionPolisIds[regionSlug] || regionDefaultPolisId || config.polisId;
}
