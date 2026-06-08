/**
 * Region configuration — civicos-side facade.
 *
 * Pure region data lives in `@civicos/shared/data/regions` (so admin can
 * consume the same single source of truth). This file:
 *   1. Re-exports everything from shared.
 *   2. Builds the env-dependent `dev` region from PUBLIC_DEV_* vars.
 *   3. Wraps subdomain/zipcode lookups to pass the dev region as fallback.
 */

import { env } from '$env/dynamic/public';
import {
	REGIONS as BASE_REGIONS,
	GENERIC_REGION,
	getRegionBySubdomain as baseGetRegionBySubdomain,
	getRegionByZipcode as baseGetRegionByZipcode,
	extractSubdomain,
	getRegionUrl,
	getEventFullDescription
} from '@civicos/shared/data/regions';
import type { RegionConfig, Partner, FaqEntry } from '@civicos/shared/data/regions';

export type { RegionConfig, Partner, FaqEntry };
export { GENERIC_REGION, extractSubdomain, getRegionUrl, getEventFullDescription };

const DEFAULT_FAQ: FaqEntry[] = [
	{
		question: 'Who can participate in this poll?',
		answer:
			'Anyone who lives in the region can vote on statements and contribute their own thoughts. There are no qualifications beyond residency.'
	},
	{
		question: 'Are my responses anonymous?',
		answer:
			'Yes. Your votes and any statements you submit are anonymous. If you share an email, that is kept separate from your contributions.'
	},
	{
		question: 'What happens to the results?',
		answer:
			'Results are published publicly when the conversation closes, and feed into live conversations and the Solutions Forum later in the campaign.'
	},
	{
		question: 'How long does this take?',
		answer:
			'Most people spend 3–5 minutes. You can come back anytime to add more votes or new statements.'
	}
];

// --- Local dev region (env-dependent) ---------------------------------------

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
				question:
					'How can developers ensure the benefits of AI are widely shared and risks are responsibly managed?',
				polisId: devPolisId,
				conversationId: devConversationId,
				inviteId: devInviteId,
				polis_workflow_step_id: devPolisWorkflowStepId,
				hostName: 'Local Dev',
				hostUrl: 'http://localhost:5173',
				zipPrefixes: [],
				heroHeader: 'AI and the Future of Our Communities',
				heroBlurb:
					'Share your thoughts with other developers who are making sense of this topic together. <a href="#context" class="text-destructive underline">Learn more →</a>',
				contextParagraphs: [
					'This is a local development environment for testing the landing page redesign.',
					'Replace this copy in your local seed if you want to see different states.'
				],
				hostsBlurb:
					'This conversation is hosted by <a href="http://localhost:5173">Local Dev</a>, with no real partners (this is your laptop).',
				partners: [{ name: 'Local Dev', url: 'http://localhost:5173' }],
				hostMessage: [
					'This is your local development environment.',
					'Changes here only affect your local database.',
					'Use this to test new features safely.'
				],
				aboutConversation: [
					'This is a local development conversation for testing the Civic OS platform.',
					'It runs on your local machine with a local Postgres database.'
				],
				campaignPageDescription: 'Local development environment for Civic OS.',
				campaignPageHosts: 'Local development',
				whatsNext: 'Keep coding!',
				goDeeper: 'Test everything!',
				faq: DEFAULT_FAQ,
				endCtaJoinDescription: 'Test conversations are taking place locally.',
				endCtaShareDescription: 'Anyone running dev is welcome to participate.',
				fullHosts: 'Local Development',
				shareUrl: 'http://dev.localhost:5173',
				events: []
			}
		: null;

// REGIONS = shared base + optional dev overlay
export const REGIONS: Record<string, RegionConfig> = {
	...(DEV_REGION ? { dev: DEV_REGION } : {}),
	...BASE_REGIONS
};

// Lookups wrapped to pass DEV_REGION as the fallback (preserves prior behaviour).
export function getRegionBySubdomain(subdomain: string): RegionConfig {
	return baseGetRegionBySubdomain(subdomain, DEV_REGION);
}
export function getRegionByZipcode(zip: string): RegionConfig {
	return baseGetRegionByZipcode(zip, DEV_REGION);
}
