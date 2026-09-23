import { error } from '@sveltejs/kit';
import { createApiClient } from '$lib/api/client';
import type { createApiClient as ApiClientFactory } from '@crownshy/api-client/client';
import { findByRouteSlug, participantBase, regionFor } from '$lib/conversations';
import { placeForCampaign } from '$lib/config/place';
import { hasLivePoll, polisConfigFor } from '$lib/polis-step';
import { ensureDefaultDemographicQuestions } from '$lib/api/demographics';
import {
	DEFAULT_DEMOGRAPHIC_SLUGS,
	demographicsFromBackend
} from '@civicos/shared/data/demographics';
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
	const demographicQuestionsPromise = ensureDefaultDemographicQuestions(api).catch((e) => {
		console.warn('Ensuring default demographic questions failed', e);
		return [];
	});
	const conversationDemographicsPromise = api
		.GetConversationDemographics({ queries: { conversation_id: summary.id, limit: 200 } })
		.then((result) => result.records)
		.catch((e) => {
			console.warn('GetConversationDemographics failed', e);
			return [];
		});

	const [conversation, polisStep, hostName, demographicQuestions, conversationDemographics] =
		await Promise.all([
			conversationPromise,
			polisStepPromise,
			hostNamePromise,
			demographicQuestionsPromise,
			conversationDemographicsPromise
		]);
	const demographicCategories = demographicsFromBackend(
		demographicQuestions,
		conversationDemographics
	);
	const defaultDemographics = demographicCategories.filter((question) =>
		(DEFAULT_DEMOGRAPHIC_SLUGS as readonly string[]).includes(question.slug)
	);
	const customDemographics = demographicCategories.filter(
		(question) => !(DEFAULT_DEMOGRAPHIC_SLUGS as readonly string[]).includes(question.slug)
	);

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
			? (conversation.translations as {
					title?: TxField;
					description?: TxField;
					faqs?: TxField;
					thankYouMessage?: TxField;
				})
			: null;
	// `faqs` and `thankYouMessage` are both nullable on the Conversation, and an
	// unset one has no TextContent at all rather than an empty one:
	// `translations.X` comes back null, so this resolves to null and the first
	// save has to create the record before it can write to it. See
	// `writeTextContent` on Setup.
	const textContent = {
		title: fieldTarget(tx?.title),
		description: fieldTarget(tx?.description),
		faqs: fieldTarget(tx?.faqs),
		thankYouMessage: fieldTarget(tx?.thankYouMessage)
	};

	const campaign = {
		id: summary.id,
		slug: summary.slug,
		title: conversation?.title ?? summary.title,
		status: summary.status,
		// Where this Campaign runs, and so the Place page it is listed on. Stored
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
		// Whether going live means launching (draft poll cloned into a new live
		// one) or only turning the Conversation back on. Null when the step did
		// not resolve: guessing "not launched" there would launch a Campaign that
		// already has live votes and strand them on the old poll.
		pollLaunched: polisStep ? polisStep.launched : null,
		// The Key Question is the Polis conversation's `topic`, edited on Setup
		// through PolisUpdateConfig. Comhairle accepts a topic but does not report
		// it back on the step, so the copy mirrored into `metadata.poll` is what
		// actually survives a reload. A legacy region's hardcoded `question` is
		// the last resort.
		keyQuestion:
			polisStep?.topic ?? readPoll(conversation?.metadata)?.question ?? region?.question ?? '',
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
					workflowStepId: polisStep.id,
					...(polisStep.polisUrl ? { polisUrl: polisStep.polisUrl } : {}),
					...(polisStep.topic ? { question: polisStep.topic } : {})
				}
			: readPoll(conversation?.metadata)
	};

	return { campaign, conversation, textContent, defaultDemographics, customDemographics };
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
			polisUrl: polis?.serverUrl ?? null,
			launched: hasLivePoll(step)
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
