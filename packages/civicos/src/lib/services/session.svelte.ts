import type { ApiClient } from '@crownshy/api-client/api';
import type { ParticipantSession } from './participant';
import { config } from './api';
import {
	clearCampaigns,
	loadAccount,
	loadCampaign,
	saveAccount,
	saveCampaign
} from './session-storage';
import { httpStatusOf } from '$lib/utils/http';

export interface UserProfile {
	id: string;
	userId: string;
	consented: boolean;
	ethnicity?: string | null;
	age?: number | null;
	gender?: string | null;
	zipcode?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	id: string;
	authType: string;
	username?: string | null;
	email?: string | null;
	emailVerified: boolean;
}

/**
 * The participant as this browser remembers them.
 *
 * Two halves, and the split is load bearing. Identity, the zip and the
 * demographics flag are the same wherever the participant goes and are
 * reconciled against the server in `hydrate`. Polis's `pid`, the vote counters
 * and the CTA flags belong to one poll and are read back per Conversation, so
 * a Place serving a second Campaign cannot resume against the first one's
 * votes. See `session-storage.ts`.
 */
class Session {
	user = $state<User | null>(null);
	profile = $state<UserProfile | null>(null);
	emailProvided = $state(false);
	zipCode = $state('');
	pid = $state<number | undefined>(undefined);
	demographicsCompleted = $state(false);
	totalVotes = $state(0);
	hasSeenPause = $state(false);
	hasSeenComposeInstructions = $state(false);
	error = $state<string | null>(null);
	loading = $state(false);
	hasAgreedToTos = $state(false);
	endCtaShareCompleted = $state(false);
	endCtaReviewCompleted = $state(false);

	/**
	 * Which Campaign the fields above that belong to a poll are currently
	 * about. Seeded from the env for the single-Conversation deployments that
	 * predate stored Campaigns, then set from the route by `useCampaign`.
	 */
	#conversationId = $state(config.conversationId);

	#api: ApiClient | null = null;

	/**
	 * Wired once from the root layout with the client built in `load`, so the
	 * session does not construct its own. Browser only: this is a module
	 * singleton and a per-request client must not leak across SSR requests.
	 */
	setApi(api: ApiClient) {
		this.#api = api;
	}

	private get api(): ApiClient {
		if (!this.#api) throw new Error('Session.setApi() was never called; see routes/+layout.svelte');
		return this.#api;
	}

	constructor() {
		const account = loadAccount();
		if (account.userId) {
			this.user = { id: account.userId, authType: 'anonymous', emailVerified: false };
		}
		this.emailProvided = account.emailProvided;
		this.zipCode = account.zipCode;
		this.demographicsCompleted = account.demographicsCompleted;
		this.hasAgreedToTos = account.hasAgreedToTos;
		this.hasSeenComposeInstructions = account.hasSeenComposeInstructions;
		this.#readCampaign();
	}

	/**
	 * Point the poll-scoped half of the session at a Campaign.
	 *
	 * Called from `[campaign]/+layout.ts`, before any page below it reads
	 * `pid` or vote progress. Until this runs the fields hold whatever the env
	 * Conversation had, which for a deployment that sets one is the same answer.
	 */
	useCampaign(conversationId: string) {
		if (!conversationId || conversationId === this.#conversationId) return;
		this.#conversationId = conversationId;
		this.#readCampaign();
	}

	#readCampaign() {
		const record = loadCampaign(this.#conversationId);
		this.pid = record.pid;
		this.totalVotes = record.totalVotes;
		this.hasSeenPause = record.hasSeenPause;
		this.endCtaShareCompleted = record.endCtaShareCompleted;
		this.endCtaReviewCompleted = record.endCtaReviewCompleted;
	}

	private persistAccount() {
		saveAccount({
			userId: this.user?.id,
			emailProvided: this.emailProvided,
			zipCode: this.zipCode,
			demographicsCompleted: this.demographicsCompleted,
			hasAgreedToTos: this.hasAgreedToTos,
			hasSeenComposeInstructions: this.hasSeenComposeInstructions
		});
	}

	private persistCampaign() {
		saveCampaign(this.#conversationId, {
			pid: this.pid,
			totalVotes: this.totalVotes,
			hasSeenPause: this.hasSeenPause,
			endCtaShareCompleted: this.endCtaShareCompleted,
			endCtaReviewCompleted: this.endCtaReviewCompleted
		});
	}

	/**
	 * Reconcile the cache against the participant the server resolved from the
	 * cookie. Called once from the root layout, before any page reads a flag.
	 *
	 * The server is the authority on identity: when it says nobody is signed in,
	 * a cache naming someone is stale and goes. It is not the authority on the
	 * two flags below, which it can turn on but never off. Leaving every About
	 * You field blank stores no demographics, and `RegisterEmailForUpdates` does
	 * not write `user.email`, so a `false` from the server means "no record of
	 * it", not "it did not happen".
	 */
	hydrate(participant: ParticipantSession | null, resolved: boolean) {
		// An unreachable backend is not an answer. Keep what we have.
		if (!resolved) return;

		if (!participant) {
			this.forget();
			return;
		}

		this.user = {
			id: participant.userId,
			authType: participant.authType,
			email: participant.email,
			emailVerified: participant.emailVerified
		};
		if (participant.zipCode) this.zipCode = participant.zipCode;
		this.emailProvided ||= participant.emailProvided;
		this.demographicsCompleted ||= participant.demographicsCompleted;
		this.persistAccount();
	}

	/**
	 * Drop the cached participant. Everything cleared here belongs to the user
	 * the expired cookie named, `pid` included: a new anonymous account gets a
	 * new Polis xid, so the old participant id would replay someone else's votes.
	 *
	 * Every Campaign's record goes, not only this one's: they are all that same
	 * account's progress, and the next visit to any of them would otherwise pick
	 * up where a stranger left off.
	 *
	 * `hasAgreedToTos` and `hasSeenComposeInstructions` are preferences of this
	 * browser rather than of that account, so they stay.
	 */
	private forget() {
		this.user = null;
		this.profile = null;
		this.zipCode = '';
		this.emailProvided = false;
		this.demographicsCompleted = false;
		this.pid = undefined;
		this.totalVotes = 0;
		this.hasSeenPause = false;
		this.endCtaShareCompleted = false;
		this.endCtaReviewCompleted = false;
		this.persistAccount();
		clearCampaigns();
	}

	get conversationId() {
		return this.#conversationId;
	}

	get userId() {
		return this.user?.id ?? null;
	}

	get isAuthenticated() {
		return this.user !== null;
	}

	get hasSession() {
		return this.user !== null && !!this.zipCode;
	}

	markComposeInstructionsSeen() {
		this.hasSeenComposeInstructions = true;
		this.persistAccount();
	}

	markAgreedToTos() {
		this.hasAgreedToTos = true;
		this.persistAccount();
	}

	markEndCtaShareCompleted() {
		this.endCtaShareCompleted = true;
		this.persistCampaign();
	}

	markEndCtaReviewCompleted() {
		this.endCtaReviewCompleted = true;
		this.persistCampaign();
	}

	savePid(pid: number) {
		this.pid = pid;
		this.persistCampaign();
	}

	markDemographicsCompleted() {
		this.demographicsCompleted = true;
		this.persistAccount();
	}

	saveVoteProgress(totalVotes: number, hasSeenPause: boolean) {
		this.totalVotes = totalVotes;
		this.hasSeenPause = hasSeenPause;
		this.persistCampaign();
	}

	async join(zipCode: string, email?: string, campaignConversationId?: string): Promise<boolean> {
		this.loading = true;
		this.error = null;
		this.zipCode = zipCode;

		if (campaignConversationId) this.useCampaign(campaignConversationId);

		try {
			// 1. Create anonymous user (sets auth-token cookie)
			const user = await this.api.SignupAnnonUser(undefined, {});
			this.user = user;
			this.persistAccount();

			// 2. Put them on the Campaign's workflow, which is where every
			// participation number comes from.
			await this.registerOnWorkflow();

			// 3. Save zipcode to profile. It has to actually land: the server side
			// gate on `/contribute` reads the stored profile, so a zip that only
			// ever existed in this tab would bounce them straight back here.
			if (zipCode && !(await this.saveProfile({ zipcode: zipCode }))) {
				throw new Error('Could not save your zip code');
			}

			// 4. Register email if provided (awaited so it completes before navigation)
			if (email) {
				await this.registerEmail(email, this.conversationId);
			}

			return true;
		} catch (e) {
			// The real error goes to the console. `error` is rendered on the landing
			// page, so it says something a participant can act on rather than
			// whatever axios called the status code.
			console.error('[Session] Failed to join:', e);
			this.error = 'Something went wrong joining this conversation. Please try again.';
			return false;
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Put this participant on the Campaign's workflow.
	 *
	 * An invite used to do this, through `AcceptInvite`, and it was ceremony: the
	 * invite carried nothing we read back, it had to be created and then mirrored
	 * onto `metadata.poll` before civicos could find it, and a Campaign without
	 * one of its own was handed another Campaign's, which 404s. Registering says
	 * the same thing directly and needs only the workflow, which
	 * `ListConversationWorkflows` answers anonymously.
	 *
	 * Not fatal to the join. A participant who votes without a participation row
	 * is a reporting gap, not a broken session, so this logs and lets them in.
	 */
	private async registerOnWorkflow(): Promise<void> {
		if (!this.conversationId) return;

		try {
			const workflows = await this.api.ListConversationWorkflows({
				params: { conversation_id: this.conversationId }
			});
			const workflow = workflows.find((w) => w.isActive) ?? workflows[0];
			if (!workflow) {
				console.warn('[Session] No workflow to register on');
				return;
			}

			await this.api.RegisterUserForConversationWorkflow(undefined, {
				params: { conversation_id: this.conversationId, workflow_id: workflow.id }
			});
		} catch (e) {
			// 409 is comhairle saying they are already on it, which is the state we
			// wanted. Anything else is worth knowing about but not worth blocking on.
			if (httpStatusOf(e) === 409) return;
			console.error('[Session] Failed to register on the workflow:', e);
		}
	}

	/**
	 * Sign this email up for updates on one Campaign.
	 *
	 * The Conversation is an argument rather than the remembered
	 * `this.conversationId`, which names whichever Campaign was loaded last and
	 * not necessarily the one the participant is looking at. `/campaign/ai` sits
	 * outside the `[campaign]` route and never points it anywhere at all.
	 */
	async registerEmail(email: string, conversationId: string): Promise<boolean> {
		this.emailProvided = true;
		this.persistAccount();

		if (!conversationId || !email) {
			console.warn('[Session] registerEmail skipped: missing conversationId or email');
			return false;
		}

		try {
			await this.api.RegisterEmailForUpdates(
				{
					email,
					receive_updates_by_email: true,
					receive_similar_conversation_updates_by_email: false
				},
				{
					params: { conversation_id: conversationId }
				}
			);
			return true;
		} catch (e) {
			console.error('[Session] Failed to register email:', e);
			return false;
		}
	}

	async saveProfile(data: {
		zipcode?: string;
		age?: number;
		ethnicity?: string;
		gender?: string;
		consented?: boolean;
		politicalParty?: string;
	}): Promise<boolean> {
		const body = {
			// The upsert replaces the whole profile, so an omitted field is a
			// delete. The About You screen sends demographics and no zip, and the
			// server side gate on `/contribute` reads the stored zip, so dropping
			// it here would lock the participant out of voting.
			zipcode: data.zipcode || this.zipCode || null,
			age: data.age ?? null,
			ethnicity: data.ethnicity ?? null,
			gender: data.gender ?? null,
			consented: data.consented ?? true,
			politicalParty: data.politicalParty ?? null
		};
		try {
			const res = await this.api.UpsertUserProfile(body);
			this.profile = res;
			return true;
		} catch (e) {
			console.error('[Session] Failed to save profile:', e);
			return false;
		}
	}

	async setStepProgress(
		workflowId: string,
		workflowStepId: string,
		status: 'not_started' | 'in_progress' | 'done'
	): Promise<boolean> {
		if (!this.conversationId || !workflowId) return false;

		try {
			// UpdateUserProgress is an object body, not a bare status string. The
			// client's types could not catch this while zod was unresolvable.
			await this.api.SetUserProgress(
				{ status },
				{
					params: {
						conversation_id: this.conversationId,
						workflow_id: workflowId,
						workflow_step_id: workflowStepId
					}
				}
			);
			return true;
		} catch (e) {
			console.error('[Session] Failed to set progress:', e);
			return false;
		}
	}
}

export const session = new Session();
