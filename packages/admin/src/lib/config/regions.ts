/**
 * Region configuration — admin-side facade.
 *
 * Mirrors the civicos pattern: pure region data lives in `@civicos/shared`,
 * and this module overlays an env-driven `dev` region so local development
 * against a local comhairle conversation Just Works.
 *
 * Env vars (shared with civicos so one `.env` works for both apps):
 *   PUBLIC_DEV_CONVERSATION_ID
 *   PUBLIC_DEV_INVITE_ID
 *   PUBLIC_DEV_POLIS_ID
 *   PUBLIC_DEV_POLIS_WORKFLOW_STEP_ID
 */

import { env } from '$env/dynamic/public';
import {
	REGIONS as BASE_REGIONS,
	GENERIC_REGION,
	getRegionBySubdomain as baseGetRegionBySubdomain,
	getRegionByZipcode as baseGetRegionByZipcode
} from '@civicos/shared/data/regions';
import type { RegionConfig, FaqEntry } from '@civicos/shared/data/regions';

export type { RegionConfig };
export { GENERIC_REGION };

const PLACEHOLDER_FAQ: FaqEntry[] = [
	{ question: '[dev placeholder]', answer: '[dev placeholder]' }
];

const devConversationId = env.PUBLIC_DEV_CONVERSATION_ID;
const devInviteId = env.PUBLIC_DEV_INVITE_ID;
const devPolisId = env.PUBLIC_DEV_POLIS_ID;
const devPolisWorkflowStepId = env.PUBLIC_DEV_POLIS_WORKFLOW_STEP_ID;

const DEV_REGION: RegionConfig | null =
	devConversationId && devInviteId && devPolisId && devPolisWorkflowStepId
		? {
				slug: 'dev',
				stateName: 'Dev',
				demonym: 'Developers',
				question: '[dev placeholder]',
				polisId: devPolisId,
				conversationId: devConversationId,
				inviteId: devInviteId,
				polis_workflow_step_id: devPolisWorkflowStepId,
				hostName: 'Local Dev',
				hostUrl: `http://localhost:5173/${devConversationId}`,
				zipPrefixes: [],
				heroHeader: '[dev placeholder]',
				heroBlurb: '[dev placeholder]',
				contextParagraphs: ['[dev placeholder]'],
				hostsBlurb: '[dev placeholder]',
				partners: [{ name: 'Local Dev', url: 'http://localhost:5173' }],
				hostMessage: ['[dev placeholder]'],
				aboutConversation: ['[dev placeholder]'],
				campaignPageDescription: '[dev placeholder]',
				campaignPageHosts: '[dev placeholder]',
				whatsNext: '[dev placeholder]',
				goDeeper: '[dev placeholder]',
				faq: PLACEHOLDER_FAQ,
				endCtaJoinDescription: '[dev placeholder]',
				endCtaShareDescription: '[dev placeholder]',
				fullHosts: 'Local Development',
				shareUrl: 'http://dev.localhost:5173',
				events: []
			}
		: null;

export const REGIONS: Record<string, RegionConfig> = {
	...(DEV_REGION ? { dev: DEV_REGION } : {}),
	...BASE_REGIONS
};

export function getRegionBySubdomain(subdomain: string): RegionConfig {
	return baseGetRegionBySubdomain(subdomain, DEV_REGION);
}
export function getRegionByZipcode(zip: string): RegionConfig {
	return baseGetRegionByZipcode(zip, DEV_REGION);
}
