import { redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createApiClient } from '$lib/api/client';
import type { createApiClient as ApiClientFactory } from '@crownshy/api-client/client';
import {
	placeFromName,
	toPlaceSlug,
	type CampaignOrg,
	type CampaignPoll
} from '@civicos/shared/data/place';
import { rescopedSlug } from '$lib/config/place';
import { describeApiFailure } from '$lib/api/describe-failure';
import { polisConfigFor } from '$lib/polis-step';
import { COHOST_ROLE, CONVERSATION_RESOURCE } from '$lib/permissions';
import { participantBase } from '$lib/conversations';
import type { PickerOrg } from '$lib/components/setup/AddCoHostsDialog.svelte';
import type { UserOrganizationAccess } from '@crownshy/api-client/api';
import { createConversationSchema } from './create-conversation-schema';
import type { Actions, PageServerLoad } from './$types';

type Api = ReturnType<typeof ApiClientFactory>;

/** The half of a created workflow step `polisConfigFor` reads. */
type StepLike = { toolConfig?: unknown; previewToolConfig?: unknown };

/** Polis defaults for a fresh poll, matching comhairle's own Setup screen. */
const REQUIRED_VOTES = 10;

export const load: PageServerLoad = async ({ cookies, url, depends }) => {
	depends('app:hosts');

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	// Hosts the caller can create a Campaign under. Ownership matters beyond
	// labelling: /c/[slug] gates on GetPermittedConversations, and an unowned
	// Campaign is absent from it, so its own Setup page would 404.
	const owned = await api
		.GetUserOrganizations()
		.then((res) => res.organizations.filter((o) => o.canUpdate || o.isAssociated))
		.catch((e) => {
			console.warn('GetUserOrganizations failed', e);
			return [] as UserOrganizationAccess[];
		});

	const hosts = owned.map((o) => ({ id: o.organization.id, name: o.organization.name }));

	// Default the owner to the Host the creator belongs to. `isAssociated` is
	// `User.organizationId`, and a Host User belongs to exactly one Host
	// (CONTEXT.md), so that is the Host they are creating on behalf of; a Super
	// user who manages several but belongs to none falls back to the first.
	// Preselected rather than forced: the select still lets them switch.
	const defaultHostId = owned.find((o) => o.isAssociated)?.organization.id ?? hosts[0]?.id ?? '';

	// Every Host on BLOOM, for the Co-Hosts picker. Co-hosting is not limited to
	// the Hosts the creator belongs to (the point is a coalition), so this is the
	// same list the Campaign's Co-Hosts card offers after creation.
	const pickerOrgs = await api
		.ListOrganizations({ queries: { limit: 200 } })
		.then((r) =>
			r.records.map((o) => ({
				id: o.id,
				name: o.name,
				website: o.externalUrl,
				email: o.contactEmail
			}))
		)
		.catch((e) => {
			console.warn('ListOrganizations failed', e);
			return [] as PickerOrg[];
		});

	const form = await superValidate(zod4(createConversationSchema));
	form.data.hostId = defaultHostId;

	// Only to show what subdomain the typed Place will be served from. Empty on a
	// deployment with no participant apex configured, where the form says nothing
	// rather than guessing a domain.
	const baseDomain = participantBase()
		.replace(/^https?:\/\//, '')
		.replace(/\/+$/, '');

	return { form, hosts, pickerOrgs, baseDomain };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod4(createConversationSchema));
		if (!form.valid) return message(form, { kind: 'error', text: 'Please fix the errors below.' });

		const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
		const { title, slug, keyQuestion, placeName, description, hostId, cohostIds } = form.data;

		const fail = (text: string) => message(form, { kind: 'error', text }, { status: 400 });

		// Refuse rather than create something invisible: /c/[slug] gates on
		// GetPermittedConversations, so a Campaign with no owning Host would 404
		// on its own Setup page the moment we redirected to it.
		if (!hostId) return fail('Choose the Host that will own this conversation.');

		// The Place, and the Conversation slug it scopes. A Campaign runs in many
		// Places and each pair is its own Conversation, so the Conversations are
		// slugged `<campaign>-<place>` (ADR 0007); the Host types a Campaign slug
		// and this follows, the same rule Setup applies when the Place changes.
		// `rescopedSlug` is idempotent, so a slug already ending in the Place ("ai-utah"
		// in Utah) is left alone rather than doubled.
		const place = placeName ? placeFromName(placeName) : null;
		if (placeName && !place) {
			return fail('That place name needs at least one letter or number.');
		}

		const conversationSlug = rescopedSlug(slug, '', place?.slug ?? '');

		// 1. The Conversation. Starts as a draft (is_live false) so the Campaign can
		//    be set up before anyone can reach the poll.
		let conversationId: string;
		try {
			const conversation = await api.CreateConversation({
				title,
				slug: conversationSlug,
				description,
				short_description: description,
				primary_locale: 'en',
				supported_languages: ['en'],
				is_live: false,
				is_public: true,
				is_invite_only: false
			});
			conversationId = conversation.id;
		} catch (e) {
			console.error('CreateConversation failed', e);
			return fail(`Could not create the conversation: ${describeApiFailure(e)}`);
		}

		// Everything past this point is a partial Campaign if it fails. A
		// Conversation with no Polis step is the broken state Setup cannot edit
		// (its Key Question has nowhere to go), so unwind rather than leave one
		// behind. The Campaign is seconds old and has never been shown to anyone.
		const rollback = async (text: string) => {
			try {
				await api.DeleteConversation(undefined, {
					params: { conversation_id: conversationId }
				});
			} catch (e) {
				console.error('Rollback DeleteConversation failed', e);
				return fail(
					`${text} A partly-created conversation was left behind; ask an admin to remove "${conversationSlug}".`
				);
			}
			return fail(text);
		};

		// 2. The workflow that holds the steps. One active workflow per Campaign
		//    (CONTEXT.md: a Campaign has exactly one Polis step).
		let workflowId: string;
		try {
			const workflow = await api.CreateConversationWorkflow(
				{
					name: title,
					description: keyQuestion,
					is_active: true,
					is_public: true,
					auto_login: false
				},
				{ params: { conversation_id: conversationId } }
			);
			workflowId = workflow.id;
		} catch (e) {
			console.error('CreateConversationWorkflow failed', e);
			return rollback(`Could not create the workflow: ${describeApiFailure(e)}`);
		}

		// 3. The Polis step. `tool_setup` is the provisioning shape: comhairle
		//    creates the Polis conversation server-side from the topic and writes
		//    the poll id and admin credentials back into the step's tool_config.
		//    That is what makes the Key Question editable on Setup afterwards.
		let polisStep: Awaited<ReturnType<typeof api.CreateConversationWorkflowStep>> | null = null;
		try {
			polisStep = await api.CreateConversationWorkflowStep(
				{
					name: 'Open Poll',
					description: keyQuestion,
					step_order: 0,
					required: true,
					is_offline: false,
					activation_rule: 'manual',
					tool_setup: {
						type: 'polis',
						topic: keyQuestion,
						required_votes: REQUIRED_VOTES,
						show_remaining_statements: true
					}
				},
				{ params: { conversation_id: conversationId, workflow_id: workflowId } }
			);
		} catch (e) {
			console.error('CreateConversationWorkflowStep failed', e);
			return rollback(`Could not create the Polis poll: ${describeApiFailure(e)}`);
		}

		// 4. Owner and default workflow. Neither is settable at create time:
		//    organization_id is not on CreateConversation, and the workflow does not
		//    exist yet. A failure here leaves a usable Campaign, so it is logged
		//    rather than rolled back, but an unowned one will not pass the
		//    /c/[slug] permission check.
		try {
			await api.UpdateConversation(
				{ default_workflow_id: workflowId, ...(hostId ? { organization_id: hostId } : {}) },
				{ params: { conversation_id: conversationId } }
			);
		} catch (e) {
			console.error('Setting owner / default workflow failed', e);
		}

		// 5. Team access, for the owning Host and any Co-Hosts picked on the form.
		//    The PUT above records the owner but does not make the Campaign visible
		//    to that Host's members: comhairle's `list_for_permitted_user` admits a
		//    Conversation on `owner_id` or a matching `resource_permissions` row,
		//    and `organization_id` is in neither, so without this grant only the
		//    creator sees what they just made (same reasoning as the sysadmin
		//    assign action, which verified it against a local backend).
		//
		//    Logged, not rolled back: the Campaign is real and editable by its
		//    creator either way, and the Co-Hosts card on Overview is where a
		//    missing Host gets re-added.
		const grantees = [hostId, ...cohostIds.filter((id) => id && id !== hostId)];
		for (const organization_id of grantees) {
			try {
				await api.GrantPermission(
					{
						organization_id,
						role_name: COHOST_ROLE,
						grant_reason:
							organization_id === hostId
								? 'Owning Host set at creation'
								: 'Co-host added at creation'
					},
					{ params: { resource_type: CONVERSATION_RESOURCE, resource_id: conversationId } }
				);
			} catch (e) {
				console.error(`GrantPermission failed for ${organization_id}`, e);
			}
		}

		// 6. Mirror the two things the participant app cannot read for itself.
		//    A Campaign is reachable at `<place>.<apex>/<org>/conversations/<slug>`
		//    from the moment it exists (a Place only moves it to a subdomain), so
		//    what that link needs belongs on the public payload now rather than at
		//    publish time: `metadata.org` because `/organizations` is 401 to the
		//    participant app, `metadata.poll` because the Polis step is too.
		//
		//    Failing here costs a Campaign that renders but sends participants to
		//    whichever poll `regions.ts` guesses, so it is logged, not rolled back.
		//    Going live mirrors the poll again, so a failure here is recoverable.
		const poll = pollIdentity(polisStep, keyQuestion);
		const org = await hostOrg(api, hostId);
		if (poll || org || place) {
			try {
				await api.PatchConversationMetadata(
					{ ...(poll ? { poll } : {}), ...(org ? { org } : {}), ...(place ? { place } : {}) },
					{ params: { conversation_id: conversationId } }
				);
			} catch (e) {
				console.error('Mirroring poll / host / place into metadata failed', e);
			}
		}

		redirect(303, `/c/${conversationSlug}/overview`);
	}
};

/**
 * The poll identity to mirror, read off the step comhairle just provisioned.
 *
 * A freshly created step reports its poll under `previewToolConfig` and leaves
 * `toolConfig` null, so `polisConfigFor` is what makes this resolvable at all
 * this early. Without it the Campaign is served with no `metadata.poll`, and
 * civicos falls back to whichever poll `regions.ts` guesses from the
 * participant's zip: locally, that is the dev seed's poll, on every new
 * Campaign.
 *
 * The Key Question comes from the form rather than the step. Comhairle takes the
 * topic in `tool_setup` but does not read it back on either config, so the form
 * is the only place it is known here.
 */
function pollIdentity(step: StepLike | null, keyQuestion: string): CampaignPoll | null {
	const polis = polisConfigFor(step);
	if (!polis) return null;

	return {
		polisId: polis.pollId,
		...(polis.serverUrl ? { polisUrl: polis.serverUrl } : {}),
		...(keyQuestion ? { question: keyQuestion } : {})
	};
}

/** The owning Host, reduced to the `<org>` URL segment and its display name. */
async function hostOrg(api: Api, hostId: string): Promise<CampaignOrg | null> {
	if (!hostId) return null;

	try {
		const { name } = await api.GetOrganization({ params: { organization_id: hostId } });
		const slug = toPlaceSlug(name ?? '');
		return slug ? { slug, name } : null;
	} catch (e) {
		console.warn('GetOrganization failed while mirroring the Host', e);
		return null;
	}
}
