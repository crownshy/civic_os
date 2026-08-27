import { redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createApiClient } from '$lib/api/client';
import { describeApiFailure } from '$lib/api/describe-failure';
import { createConversationSchema } from './create-conversation-schema';
import type { Actions, PageServerLoad } from './$types';

/** Polis defaults for a fresh poll, matching comhairle's own Setup screen. */
const REQUIRED_VOTES = 10;

export const load: PageServerLoad = async ({ cookies, url, depends }) => {
	depends('app:hosts');

	const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');

	// Hosts the caller can create a Campaign under. Ownership matters beyond
	// labelling: /c/[slug] gates on GetPermittedConversations, and an unowned
	// Campaign is absent from it, so its own Setup page would 404.
	const hosts = await api
		.GetUserOrganizations()
		.then((res) =>
			res.organizations
				.filter((o) => o.canUpdate || o.isAssociated)
				.map((o) => ({ id: o.organization.id, name: o.organization.name }))
		)
		.catch((e) => {
			console.warn('GetUserOrganizations failed', e);
			return [] as Array<{ id: string; name: string }>;
		});

	const form = await superValidate(zod4(createConversationSchema));
	if (hosts.length === 1) form.data.hostId = hosts[0].id;

	return { form, hosts };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod4(createConversationSchema));
		if (!form.valid) return message(form, { kind: 'error', text: 'Please fix the errors below.' });

		const api = createApiClient(`${url.origin}/api`, cookies.get('auth-token'), 'server');
		const { title, slug, keyQuestion, description, hostId } = form.data;

		const fail = (text: string) => message(form, { kind: 'error', text }, { status: 400 });

		// Refuse rather than create something invisible: /c/[slug] gates on
		// GetPermittedConversations, so a Campaign with no owning Host would 404
		// on its own Setup page the moment we redirected to it.
		if (!hostId) return fail('Choose the Host that will own this conversation.');

		// 1. The Conversation. Starts as a draft (is_live false) so the Campaign can
		//    be set up before anyone can reach the poll.
		let conversationId: string;
		try {
			const conversation = await api.CreateConversation({
				title,
				slug,
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
					`${text} A partly-created conversation was left behind; ask an admin to remove "${slug}".`
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
		try {
			await api.CreateConversationWorkflowStep(
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

		redirect(303, `/c/${slug}/overview`);
	}
};
