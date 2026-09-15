import { error } from '@sveltejs/kit';
import { createApiClient } from '@crownshy/api-client/client';
import type { LayoutServerLoad } from './$types';
import { resolveFaq, resolveHostCopy, type ConversationCopy } from '$lib/config/host-copy';
import {
	campaignCandidates,
	resolveCampaign,
	type CampaignConversation
} from '$lib/config/campaign';
import { extractSubdomain } from '$lib/config/regions';
import { resolveParticipation } from '$lib/config/participation';
import { readBrand, readHostBrand, resolveBrand } from '@civicos/shared/data/brand';
import { httpStatusOf } from '$lib/utils/http';

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

	// Why the lookup failed, when it did. A 404 is the only ordinary miss: the
	// list is candidates, not guarantees. The other two are not misses at all and
	// used to be swallowed as one, which told a Host their Campaign did not exist
	// when the truth was that it was still a draft or that comhairle was down.
	let draft = false;
	let unreachable = false;

	let conversation: ResolvedConversation | null = null;
	for (const candidate of campaignCandidates(slug, region, place)) {
		try {
			conversation = await api.GetConversation({ params: { conversation_id: candidate } });
			break;
		} catch (e) {
			const status = httpStatusOf(e);
			if (status === 401 || status === 403) {
				// `GET /conversation/:id` is public only once a Campaign is live, and
				// refuses anonymously otherwise. Nothing else on this endpoint answers
				// 403, so it means the Campaign exists and has not been launched.
				draft = true;
			} else if (status === undefined || status >= 500) {
				unreachable = true;
			}
		}
	}

	// A slug naming no Campaign is a wrong URL, not a reason to serve a different
	// one. The exception is a legacy region: those predate stored Campaigns, so
	// an unreachable backend must not take Utah or Oregon down with it.
	if (!conversation) {
		if (region.slug !== slug) {
			// A draft answers exactly what an unclaimed slug answers. Saying it exists
			// but is not live would leak that the slug is taken to anyone who guesses
			// it; the Host learns this from admin, where the Campaign is theirs to
			// launch. The log is where the two cases stay distinguishable.
			//
			// Checked before `unreachable` because it is the more definite answer: a
			// 403 came from a backend that was up and did know this slug, whatever
			// some other candidate did.
			if (draft) {
				console.warn(`[Campaign] "${slug}" exists but is not live yet`);
			} else if (unreachable) {
				// Distinct from a 404 because it is temporary and not the participant's
				// doing. Answering "no such Campaign" to an outage tells a Host their
				// Campaign was deleted and invites them to go and re-create it.
				error(503, {
					message: `We could not reach the service that knows about "${slug}". Try again in a moment.`
				});
			}

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
		hostCopy: resolveHostCopy(conversation, region),
		// The Host's own questions when they have written any, the `regions.ts`
		// placeholders until then.
		faq: resolveFaq(conversation, region),
		// Which demographics and which asks the Host left switched on. Falling
		// back to all-on when the Conversation is unreachable keeps a legacy
		// region asking what it always asked.
		participation: resolveParticipation(conversation),
		// Host first, Campaign second (#428), so a Campaign overrides the Host that runs
		// it. The Host layer is `metadata.hostBrand`, a mirror admin writes,
		// because `/organizations` answers 401 to an anonymous participant and
		// this is the only anonymous read there is. Anything neither layer sets
		// falls through to `theme.css`, which is already on the page.
		brand: resolveBrand(readHostBrand(conversation?.metadata), readBrand(conversation?.metadata))
	};
};
