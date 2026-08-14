import type { createApiClient } from '@crownshy/api-client/client';
import type { ConversationWithTranslations } from '@crownshy/api-client/api';
import type {
	Campaign,
	CampaignCoHost,
	CampaignCopy,
	CampaignHost,
	CampaignStatus,
	CampaignSummary,
	PolisStep
} from '$lib/types/campaign';

/**
 * Assembles Campaigns from comhairle. See ADR 0001 and CONTEXT.md § Campaign.
 *
 * No endpoint returns a Campaign: a Region, its Conversation, that Conversation's
 * Polis workflow step and its Host Organization are fetched separately and composed
 * here. Pass the `api` instance from the root layout load, as with `$lib/api/aux`.
 */

type Api = ReturnType<typeof createApiClient>;

/** There are single-digit numbers of regions; one page is the whole set. */
const REGION_PAGE_SIZE = 200;

// --- metadata readers ------------------------------------------------------
// Region and Conversation `metadata` are untyped JSON in the generated client, so
// everything below is defensive: an absent or malformed key reads as null/[].

function bag(value: unknown): Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function str(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Accepts either a paragraph array or a single string, since authors write both. */
function paragraphs(value: unknown): string[] {
	if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
	return typeof value === 'string' && value.length > 0 ? [value] : [];
}

function phaseLabels(value: unknown): CampaignCopy['phaseLabels'] {
	const p = bag(value);
	const phase1 = str(p.phase_1);
	const phase2 = str(p.phase_2);
	const phase3 = str(p.phase_3);
	return phase1 && phase2 && phase3 ? { phase1, phase2, phase3 } : null;
}

function readCopy(metadata: unknown): CampaignCopy {
	const m = bag(metadata);
	return {
		heroHeader: str(m.hero_header),
		heroBlurb: str(m.hero_blurb),
		question: str(m.question),
		contextParagraphs: paragraphs(m.context_paragraphs),
		about: paragraphs(m.about),
		hostMessage: paragraphs(m.host_message),
		hostsBlurb: str(m.hosts_blurb),
		whatsNext: str(m.whats_next),
		goDeeper: str(m.go_deeper),
		endCtaJoinDescription: paragraphs(m.end_cta_join_description)[0] ?? null,
		endCtaShareDescription: paragraphs(m.end_cta_share_description)[0] ?? null,
		phaseLabels: phaseLabels(m.phase_labels)
	};
}

// --- pieces ----------------------------------------------------------------

/** Every Region. `ListRegions` has no `official_id` filter, so resolution scans this. */
export async function listRegions(api: Api) {
	const result = await api.ListRegions({ queries: { limit: REGION_PAGE_SIZE, offset: 0 } });
	return result?.records ?? [];
}

export async function resolveRegion(api: Api, officialId: string) {
	const regions = await listRegions(api);
	return regions.find((r) => r.official_id === officialId) ?? null;
}

/**
 * Zip prefixes of a Region's areas.
 *
 * Areas are global objects linked many-to-many, and `GetRegionAreaLinks` returns only
 * ids, so this fetches the whole (small) area set once and filters rather than making
 * one request per link.
 */
export async function getRegionZipPrefixes(api: Api, regionId: string): Promise<string[]> {
	const [links, areas] = await Promise.all([
		api.GetRegionAreaLinks({ params: { region_id: regionId } }),
		api.ListRegionAreas()
	]);
	const linked = new Set(links?.area_ids ?? []);
	return (areas ?? []).filter((area) => linked.has(area.id)).map((area) => area.zipPrefix);
}

/**
 * The Conversation's Polis step, found by inspecting its workflow rather than by a
 * stored id. Returns null when the workflow has no step configured with the Polis tool.
 */
export async function findPolisStep(
	api: Api,
	conversationId: string,
	workflowId: string
): Promise<PolisStep | null> {
	const steps = await api.ListConversationWorkflowSteps({
		params: { conversation_id: conversationId, workflow_id: workflowId }
	});
	for (const step of steps ?? []) {
		const config = step.toolConfig;
		if (config && config.type === 'polis') {
			return { stepId: step.id, pollId: config.poll_id, serverUrl: config.server_url ?? null };
		}
	}
	return null;
}

async function getHost(api: Api, organizationId: string): Promise<CampaignHost | null> {
	const org = await api.GetOrganization({ params: { organization_id: organizationId } });
	if (!org) return null;
	return {
		id: org.id,
		name: org.name,
		url: org.externalUrl ?? null,
		contactEmail: org.contactEmail ?? null
	};
}

function statusOf(regionType: string, isLive: boolean): CampaignStatus {
	if (regionType === 'custom') return 'idle';
	return isLive ? 'live' : 'draft';
}

/**
 * Organizations holding the co-host role on a Conversation.
 *
 * Stubbed until `ListConversationCoHostOrganizations` ships in the generated client.
 */
export async function listCoHosts(
	api: Api,
	conversationId: string
): Promise<CampaignCoHost[]> {
    const coHosts = await api.ListConversationCoHostOrganizations({
        params: { conversation_id: conversationId }
    });
    return (coHosts ?? []).map((org) => ({
        id: org.id,
        name: org.name,
        roleName: org.roleName
    }));
}

// --- assembly --------------------------------------------------------------

/**
 * Resolve a Campaign by its Region `official_id` (the `[slug]` in `/c/[slug]`).
 *
 * Returns null when no Region carries that `official_id` — the caller should treat
 * that as a 404. Throws when comhairle is unreachable or the Region names a
 * Conversation that cannot be loaded; those are error states, not missing pages.
 */
export async function getCampaign(api: Api, officialId: string): Promise<Campaign | null> {
	const region = await resolveRegion(api, officialId);
	if (!region) return null;

	const regionMeta = bag(region.metadata);
	const conversationId = str(regionMeta.conversation_id);
	if (!conversationId) {
		throw new Error(`Region "${officialId}" has no conversation_id in its metadata`);
	}

	// withTranslations returns each text field's TextContent id, which is what the
	// setup page writes title/description edits against. See #391.
	const conversation = (await api.GetConversation({
		params: { conversation_id: conversationId },
		queries: { withTranslations: true }
	})) as ConversationWithTranslations;

	const [zipPrefixes, polis, host, coHosts] = await Promise.all([
		getRegionZipPrefixes(api, region.id),
		conversation.defaultWorkflowId
			? findPolisStep(api, conversationId, conversation.defaultWorkflowId)
			: null,
		conversation.organizationId ? getHost(api, conversation.organizationId) : null,
		listCoHosts(api, conversationId)
	]);

	const conversationMeta = bag(conversation.metadata);

	return {
		regionId: region.id,
		officialId,
		name: region.name,
		demonym: str(regionMeta.demonym),
		zipPrefixes,
		conversationId,
		conversation,
		polis,
		host,
		coHosts,
		shareUrl: str(conversationMeta.share_url),
		copy: readCopy(conversation.metadata)
	};
}

/**
 * Every Campaign, reduced to what the sidebar and dashboard render.
 *
 * Costs one request per Region on top of `ListRegions`. Regions whose Conversation
 * fails to load are still listed, falling back to the Region's own name.
 */
export async function listCampaignSummaries(api: Api): Promise<CampaignSummary[]> {
	const regions = await listRegions(api);

	return Promise.all(
		regions.map(async (region): Promise<CampaignSummary> => {
			const conversationId = str(bag(region.metadata).conversation_id);
			const base = {
				regionId: region.id,
				officialId: region.official_id ?? '',
				name: region.name,
				conversationId
			};

			if (!conversationId) {
				return { ...base, title: region.name, shareUrl: null, status: 'draft' };
			}

			try {
				const conversation = await api.GetConversation({
					params: { conversation_id: conversationId }
				});
				const meta = bag(conversation?.metadata);
				return {
					...base,
					title: conversation?.title || region.name,
					shareUrl: str(meta.share_url),
					status: statusOf(region.region_type, conversation?.isLive ?? false)
				};
			} catch (e) {
				console.warn(`GetConversation failed for region ${region.official_id}`, e);
				return { ...base, title: region.name, shareUrl: null, status: 'draft' };
			}
		})
	);
}

/** Number of events on a Campaign's Conversation, for the dashboard cards. */
export async function countEvents(api: Api, conversationId: string): Promise<number> {
	try {
		const result = await api.ListEvents({ params: { conversation_id: conversationId } });
		return result?.total ?? result?.records?.length ?? 0;
	} catch (e) {
		console.warn('ListEvents failed', e);
		return 0;
	}
}
