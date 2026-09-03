import type { ApiClient } from '@crownshy/api-client/api';
import type { ParticipantSession } from './participant';
import { config } from './api';
import { GENERIC_REGION, REGIONS } from '$lib/config/regions';

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
 * The localStorage cache. A cache, not the source of truth: the root layout
 * resolves the participant from the `auth-token` cookie during SSR and
 * `hydrate` reconciles what is here against that answer. What survives on its
 * own is only what the backend has no record of, which is Polis's `pid`, vote
 * progress and the end-of-flow CTA flags.
 */
const STORAGE_KEY = 'civic-os-session';

export function getCountyFromZip(zip: string): string {
	const trimmed = zip.trim();

	// Fallback: prefix-based heuristic
	const prefix = trimmed.slice(0, 2);
	let region = Object.values(REGIONS).find((region) => region.zipPrefixes.includes(prefix));
	if (region) {
		return region.stateName;
	} else {
		return GENERIC_REGION.stateName;
	}
}

function loadPersistedSession(): {
	userId?: string;
	emailProvided?: boolean;
	zipCode?: string;
	pid?: number;
	demographicsCompleted?: boolean;
	totalVotes?: number;
	hasSeenPause?: boolean;
	hasAgreedToTos?: boolean;
	hasSeenComposeInstructions?: boolean;
	conversationId?: string;
	endCtaShareCompleted?: boolean;
	endCtaReviewCompleted?: boolean;
} {
	if (typeof window === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

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
	_conversationId = $state('');
	endCtaShareCompleted = $state(false);
	endCtaReviewCompleted = $state(false);

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
		const saved = loadPersistedSession();
		if (saved.userId) {
			this.user = { id: saved.userId, authType: 'anonymous', emailVerified: false };
		}
		if (saved.emailProvided) this.emailProvided = true;
		if (saved.zipCode) this.zipCode = saved.zipCode;
		if (saved.pid !== undefined) this.pid = saved.pid;
		if (saved.demographicsCompleted) this.demographicsCompleted = true;
		if (saved.totalVotes) this.totalVotes = saved.totalVotes;
		if (saved.hasSeenPause) this.hasSeenPause = saved.hasSeenPause;
		if (saved.hasAgreedToTos) this.hasAgreedToTos = saved.hasAgreedToTos;
		if (saved.hasSeenComposeInstructions) this.hasSeenComposeInstructions = true;
		if (saved.conversationId) this._conversationId = saved.conversationId;
		if (saved.endCtaShareCompleted) this.endCtaShareCompleted = true;
		if (saved.endCtaReviewCompleted) this.endCtaReviewCompleted = true;
	}

	private persist() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					userId: this.user?.id,
					emailProvided: this.emailProvided,
					zipCode: this.zipCode,
					pid: this.pid,
					demographicsCompleted: this.demographicsCompleted,
					totalVotes: this.totalVotes,
					hasSeenPause: this.hasSeenPause,
					hasAgreedToTos: this.hasAgreedToTos,
					hasSeenComposeInstructions: this.hasSeenComposeInstructions,
					conversationId: this._conversationId,
					endCtaShareCompleted: this.endCtaShareCompleted,
					endCtaReviewCompleted: this.endCtaReviewCompleted
				})
			);
		} catch {
			/* ignore */
		}
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
		this.persist();
	}

	/**
	 * Drop the cached participant. Everything cleared here belongs to the user
	 * the expired cookie named, `pid` included: a new anonymous account gets a
	 * new Polis xid, so the old participant id would replay someone else's votes.
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
		this.persist();
	}

	get conversationId() {
		return this._conversationId || config.conversationId;
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
		this.persist();
	}

	markEndCtaShareCompleted() {
		this.endCtaShareCompleted = true;
		this.persist();
	}

	markEndCtaReviewCompleted() {
		this.endCtaReviewCompleted = true;
		this.persist();
	}

	get county(): string {
		return this.zipCode ? getCountyFromZip(this.zipCode) : 'Utah';
	}

	savePid(pid: number) {
		this.pid = pid;
		this.persist();
	}

	markDemographicsCompleted() {
		this.demographicsCompleted = true;
		this.persist();
	}

	saveVoteProgress(totalVotes: number, hasSeenPause: boolean) {
		this.totalVotes = totalVotes;
		this.hasSeenPause = hasSeenPause;
		this.persist();
	}

	setSessionField(field: keyof typeof this, value: any) {
		this[field] = value;
		this.persist();
	}

	async join(zipCode: string, email?: string, campaignConversationId?: string): Promise<boolean> {
		this.loading = true;
		this.error = null;
		this.zipCode = zipCode;

		if (campaignConversationId) this._conversationId = campaignConversationId;

		try {
			// 1. Create anonymous user (sets auth-token cookie)
			const user = await this.api.SignupAnnonUser(undefined, {});
			this.user = user;
			this.persist();

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
				await this.registerEmail(email);
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
			if ((e as { response?: { status?: number } })?.response?.status === 409) return;
			console.error('[Session] Failed to register on the workflow:', e);
		}
	}

	async registerEmail(email: string): Promise<boolean> {
		this.emailProvided = true;
		this.persist();

		if (!this.conversationId || !email) {
			console.warn('[Session] registerEmail skipped: missing conversationId or email');
			return false;
		}

		try {
			const result = await this.api.RegisterEmailForUpdates(
				{
					email,
					receive_updates_by_email: true,
					receive_similar_conversation_updates_by_email: false
				},
				{
					params: { conversation_id: this.conversationId }
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
