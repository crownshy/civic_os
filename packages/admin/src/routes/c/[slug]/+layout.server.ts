import { error } from '@sveltejs/kit';
import { createApiClient } from '$lib/api/client';
import type { createApiClient as ApiClientFactory } from '@crownshy/api-client/client';
import { findByRouteSlug, participantBase, regionFor } from '$lib/conversations';
import { placeForCampaign } from '$lib/config/place';
import { polisConfigFor } from '$lib/polis-step';
import { readPoll } from '@civicos/shared/data/place';
import type { LayoutServerLoad } from './$types';

type Api = ReturnType<typeof ApiClientFactory>;

export const load: LayoutServerLoad = async ({ params, parent, cookies, url, depends }) => {
	depends(`campaign:${params.slug}`);

	// The permitted list is this route's access check, not just its lookup: a
	// Campaign the caller's Host has no role on is simply absent from it, so
	// typing the URL 404s the same way an unknown slug does (#397). If the list
	// call itself failed upstream it is empty, which fails closed.
	const { conversations } = await parent();
	const summary = findByRouteSlug(conversations, params.slug);
	if (!summary) {
		error(404, `Unknown conversation: ${params.slug}`);
	}

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	// withTranslations (admin only) returns the resolved display strings *and*
	// each text field's TextContent id + locale. Those ids are what edits are
	// written against: Conversation.title/description are TextContentId (UUID)
	// references, not text columns, so they can only be edited via the
	// translations endpoints, never UpdateConversation. See #391.
	const conversationPromise = api
		.GetConversation({
			params: { conversation_id: summary.id },
			queries: { withTranslations: true }
		})
		.catch((e) => {
			console.warn('GetConversation failed', e);
			return null;
		});

	// The Polis step carries both the id every Polis surface keys off and the
	// `topic`, which is the Key Question on Setup. `regions.ts` hardcodes the id
	// per region, so legacy regions keep using their configured value and only
	// fall back to the workflow's answer, leaving existing deployments untouched
	// (#401, Q1.3). The step is now resolved either way, because the topic is
	// only readable from its tool config.
	const region = regionFor(summary);
	const polisStepPromise = resolvePolisStep(api, summary.id, region?.polis_workflow_step_id);

	// The owning Host's name, shown as the contact on an Event. `regions.ts`
	// duplicates it as `hostName`; the Conversation's organization is the real
	// source, so that copy is only a fallback for when the org is not readable.
	const hostNamePromise = summary.organizationId
		? api
				.GetOrganization({ params: { organization_id: summary.organizationId } })
				.then((organization) => organization.name)
				.catch(() => null)
		: Promise.resolve(null);

	const [conversation, polisStep, hostName] = await Promise.all([
		conversationPromise,
		polisStepPromise,
		hostNamePromise
	]);

	// Pull out the { id, locale } we POST title/description edits against. Null
	// when the backend didn't return translation detail (non-admin, or the
	// conversation id doesn't resolve on this backend), in which case those
	// fields fall back to read-only rendering.
	//
	// The generated `ConversationWithTranslations['translations']` type collapses
	// to `{}` (the schema is too deeply nested for TS to infer), so we read the
	// runtime-validated shape through this narrow local type.
	const tx =
		conversation && 'translations' in conversation
			? (conversation.translations as { title?: TxField; description?: TxField })
			: null;
	const textContent = {
		title: fieldTarget(tx?.title),
		description: fieldTarget(tx?.description)
	};

	const campaign = {
		id: summary.id,
		slug: summary.slug,
		title: conversation?.title ?? summary.title,
		status: summary.status,
		// Where this Campaign runs, and so the subdomain it is served from. Stored
		// on the Conversation's metadata and editable on Setup; a legacy region
		// entry is the fallback. The list resolves the same thing in `toSummary`,
		// so this and the dashboard agree.
		place: placeForCampaign(conversation?.metadata, region),
		// Utah and Oregon predate place-scoped slugs and their slugs are pinned by
		// `regions.ts`. Setup must never auto-rename one off the back of a Place
		// edit: the many-to-many scheme is for new Campaigns (ADR 0007).
		isLegacyRegion: !!region,
		shareUrl: summary.shareUrl,
		// Why there is no link, when there is none. A Campaign no longer needs a
		// Place to have an address, so "publish it somewhere" stopped being the
		// answer: either this deployment has no participant apex configured, which
		// costs every Campaign its link at once, or the Conversation has no slug to
		// address it by.
		shareUrlBlocker: summary.shareUrl
			? null
			: participantBase()
				? ('slug' as const)
				: ('apex' as const),
		hostName: hostName ?? region?.hostName ?? '',
		polisWorkflowStepId: region?.polis_workflow_step_id ?? polisStep?.id ?? null,
		// The Key Question is the Polis conversation's `topic`, edited on Setup
		// through PolisUpdateConfig. A legacy region's hardcoded `question` is
		// only the fallback now, for Campaigns whose Polis step did not resolve.
		keyQuestion: polisStep?.topic ?? region?.question ?? '',
		// What a mirror writes to `metadata.poll`, merged over what is already
		// stored. `PatchConversationMetadata` replaces this key wholesale and
		// comhairle reports no `topic` back on either tool config, so an object
		// built from the step alone would silently drop the Key Question the create
		// form collected. Falls back to the stored object when no step resolves, so
		// a mirror can only ever add to what a Campaign already has.
		pollIdentity: polisStep?.polisId
			? {
					...readPoll(conversation?.metadata),
					polisId: polisStep.polisId,
					...(polisStep.polisUrl ? { polisUrl: polisStep.polisUrl } : {}),
					...(polisStep.topic ? { question: polisStep.topic } : {})
				}
			: readPoll(conversation?.metadata),
		// Still sourced from `regions.ts`, because the Conversation model has
		// nowhere to put them yet: the public participant URL and the zip
		// prefixes that scope the participants county rollup. Campaigns without a
		// region entry render without them (#401).
		zipPrefixes: region?.zipPrefixes ?? []
	};

	return { campaign, conversation, textContent };
};

/**
 * The workflow step wrapping this Campaign's Polis poll: the id Insights and the
 * Open Poll surfaces key everything off, plus the `topic` Setup renders as the
 * Key Question.
 *
 * `pinnedStepId` is a legacy region's configured id. Preferring that step keeps
 * the id and the topic pointing at the same step, rather than reading the topic
 * off one step and writing edits against another.
 */
async function resolvePolisStep(api: Api, conversationId: string, pinnedStepId?: string) {
	try {
		const workflows = await api.ListConversationWorkflows({
			params: { conversation_id: conversationId }
		});
		const workflow = workflows.find((w) => w.isActive) ?? workflows[0];
		if (!workflow) return null;

		const steps = await api.ListConversationWorkflowSteps({
			params: { conversation_id: conversationId, workflow_id: workflow.id }
		});
		// `polisConfigFor` is both the search and the read, so the step this picks
		// and the poll it reports cannot come from different places. It looks past
		// `toolConfig` to the preview config, without which a Campaign created in
		// admin has no Polis step at all as far as this function is concerned.
		const isPolis = (step: (typeof steps)[number]) => !!polisConfigFor(step);
		const step = steps.find((s) => s.id === pinnedStepId && isPolis(s)) ?? steps.find(isPolis);
		if (!step) return null;

		const polis = polisConfigFor(step);

		return {
			id: step.id,
			topic: polis?.topic ?? null,
			// Mirrored into `metadata.poll` so the participant app can read them:
			// this step is 401 anonymously, and civicos has no other way to learn
			// which Polis conversation it is serving.
			polisId: polis?.pollId ?? null,
			polisUrl: polis?.serverUrl ?? null
		};
	} catch (e) {
		console.warn('Resolving the Polis workflow step failed', e);
		return null;
	}
}

type TxField = { textContent?: { id: string; primaryLocale: string } | null } | null;

/** Reduce a withTranslations field to the { id, locale } an edit is written to. */
function fieldTarget(field: TxField | undefined) {
	const tc = field?.textContent;
	return tc ? { id: tc.id, locale: tc.primaryLocale } : null;
}
