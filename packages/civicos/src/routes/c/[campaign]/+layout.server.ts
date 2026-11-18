import { error } from '@sveltejs/kit';
import { serverApi, type Api } from '@civicos/shared/api';
import type { LayoutServerLoad } from './$types';
import { resolveFaq, resolveHostCopy, type ConversationCopy } from '$lib/config/host-copy';
import {
	campaignCandidates,
	legacyRegionForSlug,
	regionForCampaign,
	resolveCampaign,
	shareUrlFor,
	type CampaignConversation
} from '$lib/config/campaign';
import { resolveParticipation } from '$lib/config/participation';
import { readColorScheme } from '@civicos/shared/data/color-scheme';
import { pollStatusFor } from '@civicos/shared/data/poll-status';
import { httpStatusOf } from '$lib/utils/http';
import { HOST_SESSION_COOKIE } from '@civicos/shared/data/host-session';

type ResolvedConversation = CampaignConversation &
	ConversationCopy & { isLive: boolean; isComplete: boolean; organizationId?: string | null };

/**
 * The Campaign at `/c/<slug>` (ADR 0019). A Place has its own page at
 * `/p/<slug>`, so a slug here only ever names a Campaign.
 */
export const load: LayoutServerLoad = async ({ params, url, cookies, depends }) => {
	const slug = params.campaign;

	// Admin edits this copy in real time, so it needs a key an invalidation can
	// target rather than relying on a full reload.
	depends('civicos:conversation');

	// This runs server-side rather than in a universal load because that one
	// returns the api client, which cannot be serialized, so SvelteKit re-runs
	// it on hydration. Fetching there would cost two requests per first paint.
	// `campaign` and `hostCopy` are plain data, so they transport.
	const api = serverApi(url);

	// Why the lookup failed, when it did. A 404 is the only ordinary miss: the
	// list is candidates, not guarantees. The other two are not misses at all and
	// used to be swallowed as one, which told a Host their Campaign did not exist
	// when the truth was that it was still a draft or that comhairle was down.
	let draft = false;
	let unreachable = false;
	// A draft read with the Host's own session, which admin shares with this
	// site through the host-session cookie. Comhairle answers it for anyone
	// with Read on the Conversation, so co-hosts can preview as well.
	let preview = false;
	const hostApi = hostSessionApi(url, cookies.get(HOST_SESSION_COOKIE));

	let conversation: ResolvedConversation | null = null;
	for (const candidate of campaignCandidates(slug)) {
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
				conversation = await readDraft(hostApi, candidate);
				if (conversation) {
					preview = true;
					break;
				}
			} else if (status === undefined || status >= 500) {
				unreachable = true;
			}
		}
	}

	// A slug naming no Campaign is a 404. The exception is a legacy region:
	// those predate stored Campaigns, so an unreachable backend must not take
	// Utah or Oregon down with it.
	if (!conversation) {
		if (!legacyRegionForSlug(slug)) {
			// A draft answers exactly what an unclaimed slug answers. Saying it exists
			// but is not live would leak that the slug is taken to anyone who guesses
			// it; the Host learns this from admin, where the Campaign is theirs to
			// launch. The log is where the two cases stay distinguishable.
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

	// Picked by the Campaign, not by the host it was opened under: any host
	// serves any Campaign now (ADR 0011). Not returned: everything a page needs
	// from it is resolved onto the Campaign and the Host copy here (#548).
	const region = regionForCampaign(conversation?.id, slug);
	const campaign = resolveCampaign(conversation, region);

	// The region supplies copy only where it IS the Campaign. Behind anything
	// created in admin sits the USA catch-all, whose Context and FAQ describe The
	// Bloom Project, so a Host who has not written theirs yet would publish
	// somebody else's (#425).
	const legacyDefaults = campaign.isLegacyRegion ? region : null;

	return {
		campaign,
		// Derived from this request, not from `regions.ts`: a stored `shareUrl`
		// pointed every admin-created Campaign at the USA catch-all.
		shareUrl: shareUrlFor(campaign, url),
		hostCopy: resolveHostCopy(conversation, legacyDefaults),
		// The Host's own questions when they have written any, and for Utah and
		// Oregon the `regions.ts` placeholders until then.
		faq: resolveFaq(conversation, legacyDefaults),
		// Which participant asks the Host left switched on.
		participation: resolveParticipation(conversation),
		// Null when the Host never picked one, and `theme.css` (Green) shows through.
		colorScheme: readColorScheme(conversation?.metadata),
		// Live, Paused or Done (#443). A draft only gets here as a preview; for
		// anyone else it 404s above. An unreachable legacy region reads as live,
		// the same way it keeps its copy.
		pollStatus: conversation ? pollStatusFor(conversation) : ('live' as const),
		preview,
		previewOrganizationId: preview ? (conversation?.organizationId ?? null) : null
	};
};

/** A client on the Host's admin session, when the request carries one. */
function hostSessionApi(url: URL, hostToken: string | undefined): Api | null {
	if (!hostToken) return null;
	return serverApi(url, hostToken);
}

async function readDraft(hostApi: Api | null, candidate: string) {
	if (!hostApi) return null;
	try {
		return await hostApi.GetConversation({ params: { conversation_id: candidate } });
	} catch {
		// Signed out of admin, or not on this Campaign's team: the same 404 a
		// stranger gets.
		return null;
	}
}
