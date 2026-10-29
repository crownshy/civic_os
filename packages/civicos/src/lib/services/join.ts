import type { ApiClient } from '@crownshy/api-client/api';
import { invalidate } from '$app/navigation';
import { httpStatusOf } from '$lib/utils/http';
import { saveProfile, type ProfileContext } from './profile';
import { session } from './session.svelte';

/**
 * The Campaign a participant is joining or signing up on, taken from the route
 * rather than remembered, so every write names the Campaign on screen.
 */
export interface JoinContext extends ProfileContext {
	api: ProfileContext['api'] &
		Pick<
			ApiClient,
			| 'SignupGuestUser'
			| 'ListConversationWorkflows'
			| 'RegisterUserForConversationWorkflow'
			| 'RegisterEmailForUpdates'
		>;
	conversationId: string;
}

/** The context for a Campaign's page, from what its layout load resolved. */
export function joinContextFor(data: {
	api: JoinContext['api'];
	campaign: { id: string };
	preview: boolean;
}): JoinContext {
	return { api: data.api, conversationId: data.campaign.id, preview: data.preview };
}

/**
 * Create a guest account for this browser and put it on the Campaign.
 *
 * Re-runs the root layout's participant load on success, so the server side
 * gate on the poll sees the participant that now exists.
 */
export async function join(context: JoinContext, zipCode: string): Promise<boolean> {
	// Nothing to sign up, and the zip is not kept: the account record is
	// shared by every Campaign. The poll votes under a throwaway xid.
	if (context.preview) return true;

	try {
		// Sets the auth-token cookie every later call rides on.
		const user = await context.api.SignupGuestUser(undefined, {});
		session.rememberJoin(user, zipCode);

		await registerOnWorkflow(context);

		// Best effort. TEMPORARY: comhairle 404s the first profile write because
		// there is no `zipcode` demographics question to file the answer under,
		// so this fails for everyone and the throw it used to do ended every
		// first join. Put the throw back once that question exists.
		if (zipCode) await saveProfile(context, { zipcode: zipCode });
	} catch (e) {
		console.error('[Join] Failed to join:', e);
		return false;
	}

	await invalidate('civicos:participant');
	return true;
}

/**
 * Put a participant who already has an account on this Campaign's workflow.
 *
 * Every Campaign shares one origin, and so one `auth-token`, since the Place
 * left the hostname (ADR 0011). Someone who joined Utah arrives at Oregon
 * already known, skips `join`, and would otherwise vote without ever being
 * registered on Oregon's workflow.
 */
export async function enterCampaign(context: JoinContext): Promise<void> {
	if (context.preview) return;
	await registerOnWorkflow(context);
}

/**
 * Sign this email up for updates on the Campaign.
 *
 * The signup is a call as the participant, so someone who has not joined gets
 * a minimal account (no zip) first. Only a signup that went through is
 * remembered, so a failure asks again.
 */
export async function signUpForUpdates(context: JoinContext, email: string): Promise<boolean> {
	if (!email || !context.conversationId) return false;
	if (context.preview) {
		session.markEmailRegistered(context.conversationId);
		return true;
	}
	if (!session.isAuthenticated && !(await join(context, ''))) return false;

	try {
		await context.api.RegisterEmailForUpdates(
			{
				email,
				receive_updates_by_email: true,
				receive_similar_conversation_updates_by_email: false
			},
			{ params: { conversation_id: context.conversationId } }
		);
	} catch (e) {
		console.error('[Join] Failed to register email:', e);
		return false;
	}
	session.markEmailRegistered(context.conversationId);
	return true;
}

/**
 * Put this participant on the Campaign's workflow, which is where every
 * participation number comes from. Registering needs only the workflow, which
 * `ListConversationWorkflows` answers anonymously.
 *
 * Not fatal to the join. A participant who votes without a participation row
 * is a reporting gap, not a broken session, so this logs and lets them in.
 */
async function registerOnWorkflow(context: JoinContext): Promise<void> {
	if (!context.conversationId) return;

	try {
		const workflows = await context.api.ListConversationWorkflows({
			params: { conversation_id: context.conversationId }
		});
		const workflow = workflows.find((w) => w.isActive) ?? workflows[0];
		if (!workflow) {
			console.warn('[Join] No workflow to register on');
			return;
		}

		await context.api.RegisterUserForConversationWorkflow(undefined, {
			params: { conversation_id: context.conversationId, workflow_id: workflow.id }
		});
	} catch (e) {
		// 409 is comhairle saying they are already on it, which is the state we
		// wanted. Anything else is worth knowing about but not worth blocking on.
		if (httpStatusOf(e) === 409) return;
		console.error('[Join] Failed to register on the workflow:', e);
	}
}
