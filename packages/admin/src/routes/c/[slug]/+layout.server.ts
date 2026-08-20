import { error } from '@sveltejs/kit';
import { createApiClient } from '$lib/api/client';
import type { createApiClient as ApiClientFactory } from '@crownshy/api-client/client';
import { findByRouteSlug, regionFor } from '$lib/conversations';
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

	// `regions.ts` hardcodes the Polis step per region; comhairle exposes it on
	// the Campaign's active workflow. Legacy regions keep using their configured
	// value so existing deployments are untouched, and everything else resolves
	// it from the backend. Once the configured ids are confirmed to match what
	// the workflow reports, the region branch can go (#401, Q1.3).
	const region = regionFor(summary);
	const polisStepPromise = region
		? Promise.resolve(region.polis_workflow_step_id)
		: resolvePolisWorkflowStepId(api, summary.id);

	// The owning Host's name, shown as the contact on an Event. `regions.ts`
	// duplicates it as `hostName`; the Conversation's organization is the real
	// source, so that copy is only a fallback for when the org is not readable.
	const hostNamePromise = summary.organizationId
		? api
				.GetOrganization({ params: { organization_id: summary.organizationId } })
				.then((organization) => organization.name)
				.catch(() => null)
		: Promise.resolve(null);

	const [conversation, polisWorkflowStepId, hostName] = await Promise.all([
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
		placeName: summary.placeName,
		shareUrl: summary.shareUrl,
		hostName: hostName ?? region?.hostName ?? '',
		polisWorkflowStepId,
		// Still sourced from `regions.ts`, because the Conversation model has
		// nowhere to put them yet: the public participant URL, the key question
		// shown on Setup, and the zip prefixes that scope the participants county
		// rollup. Campaigns without a region entry render without them (#401).
		zipPrefixes: region?.zipPrefixes ?? [],
		keyQuestion: region?.question ?? ''
	};

	return { campaign, conversation, textContent };
};

/**
 * The workflow step wrapping this Campaign's Polis poll. Insights and the Open
 * Poll surfaces key everything off this id.
 */
async function resolvePolisWorkflowStepId(api: Api, conversationId: string) {
	try {
		const workflows = await api.ListConversationWorkflows({
			params: { conversation_id: conversationId }
		});
		const workflow = workflows.find((w) => w.isActive) ?? workflows[0];
		if (!workflow) return null;

		const steps = await api.ListConversationWorkflowSteps({
			params: { conversation_id: conversationId, workflow_id: workflow.id }
		});
		return steps.find((step) => step.toolConfig?.type === 'polis')?.id ?? null;
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
