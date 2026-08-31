import { error } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import type { LayoutServerLoad } from './$types';
import { resolveHostCopy, type ConversationCopy } from '$lib/config/host-copy';
import {
	campaignCandidates,
	resolveCampaign,
	type CampaignConversation
} from '$lib/config/campaign';
import { extractSubdomain } from '$lib/config/regions';

type ResolvedConversation = CampaignConversation & ConversationCopy;

export const load: LayoutServerLoad = async ({ params, locals, url, depends }) => {
	const region = locals.region;
	const slug = params.campaign;

	// Admin edits this copy in real time, so it needs a key an invalidation can
	// target rather than relying on a full reload.
	depends('civicos:conversation');

	// This runs server-side rather than in a universal load because that one
	// returns the api client, which cannot be serialized, so SvelteKit re-runs
	// it on hydration. Fetching there would cost two requests per first paint.
	// `campaign` and `hostCopy` are plain data, so they transport.
	const api = createApiClient(`${url.origin}/api`, undefined, 'server');

	// The Place is part of the lookup, not just the branding: `/ai` under `utah.`
	// is the Conversation `ai-utah`. See `conversationSlugFor`.
	const place = extractSubdomain(url.hostname);

	let conversation: ResolvedConversation | null = null;
	for (const candidate of campaignCandidates(slug, region, place)) {
		try {
			conversation = await api.GetConversation({ params: { conversation_id: candidate } });
			break;
		} catch {
			// A miss here is ordinary: the list is candidates, not guarantees.
		}
	}

	// A slug naming no Campaign is a wrong URL, not a reason to serve a different
	// one. The exception is a legacy region: those predate stored Campaigns, so
	// an unreachable backend must not take Utah or Oregon down with it.
	if (!conversation) {
		if (region.slug !== slug) {
			error(404, { message: `There is no Campaign called "${slug}".` });
		}
		console.warn(`[Campaign] "${slug}" unreachable, falling back to region defaults`);
	}

	const campaign = resolveCampaign(conversation, region);

	// A Campaign has a participant site from the moment it is created. The path
	// alone identifies it, so an unpublished Campaign is served from the apex;
	// publishing it to a Place gives it a nicer address, not its first one.
	//
	// Once it HAS a Place it is served only from there. Without that check any
	// subdomain serves any Campaign, because the region lookup falls back rather
	// than failing and so never rejects anything. No corrective link: see
	// ADR 0007.
	if (campaign.place && campaign.place.slug !== place) {
		error(404, { message: `This Campaign does not run here.` });
	}

	return {
		campaign,
		hostCopy: resolveHostCopy(conversation, region)
	};
};
