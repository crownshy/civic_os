import type { ParticipantSession } from './participant';
import {
	clearCampaigns,
	loadAccount,
	loadCampaign,
	saveAccount,
	saveCampaign
} from './session-storage';

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
 *
 * Storage only: nothing here calls comhairle. Joining and signing up for
 * updates are in `join.ts`, About You answers in `profile.ts`, and which
 * participant a page is talking to is resolved in the `[campaign]` layout load.
 */
class Session {
	user = $state<User | null>(null);
	/** The account has an email on it, from the server. Counts for every Campaign. */
	#accountEmail = $state(false);
	/** This Campaign signed the participant up for updates. */
	emailRegistered = $state(false);
	zipCode = $state('');
	pid = $state<number | undefined>(undefined);
	demographicsCompleted = $state(false);
	totalVotes = $state(0);
	hasSeenPause = $state(false);
	hasSeenComposeInstructions = $state(false);
	hasAgreedToTos = $state(false);
	endCtaShareCompleted = $state(false);
	endCtaReviewCompleted = $state(false);
	/** Events of this Campaign this browser registered for. Cache, not record (#420). */
	registeredEventIds = $state<string[]>([]);

	/**
	 * Which Campaign the fields above that belong to a poll are currently about.
	 *
	 * Empty until `useCampaign` is called from the `[campaign]` layout load,
	 * which runs before any component below it. It used to be seeded from
	 * `PUBLIC_CONVERSATION_ID`, for deployments that served one Conversation and
	 * predate the URL naming it (#421).
	 */
	#conversationId = $state('');

	/**
	 * A Host previewing a draft. Its poll-scoped record is kept apart, so the
	 * preview poll's `pid` never resumes against the live one, and it never
	 * writes the account record every Campaign shares. `join.ts` and
	 * `profile.ts` keep its answers away from comhairle.
	 */
	#preview = $state(false);

	constructor() {
		const account = loadAccount();
		if (account.userId) {
			this.user = { id: account.userId, authType: 'guest', emailVerified: false };
		}
		this.#accountEmail = account.emailProvided;
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
	useCampaign(conversationId: string, preview = false) {
		if (!conversationId) return;
		if (conversationId === this.#conversationId && preview === this.#preview) return;
		this.#conversationId = conversationId;
		this.#preview = preview;
		this.#readCampaign();
	}

	/** Where this Campaign's poll-scoped record is stored. */
	get #campaignKey() {
		return this.#preview ? `preview:${this.#conversationId}` : this.#conversationId;
	}

	#readCampaign() {
		const record = loadCampaign(this.#campaignKey);
		this.pid = record.pid;
		this.totalVotes = record.totalVotes;
		this.hasSeenPause = record.hasSeenPause;
		this.endCtaShareCompleted = record.endCtaShareCompleted;
		this.endCtaReviewCompleted = record.endCtaReviewCompleted;
		this.emailRegistered = record.emailRegistered;
		this.registeredEventIds = record.registeredEventIds;
	}

	private persistAccount() {
		saveAccount({
			userId: this.user?.id,
			emailProvided: this.#accountEmail,
			zipCode: this.zipCode,
			demographicsCompleted: this.demographicsCompleted,
			hasAgreedToTos: this.hasAgreedToTos,
			hasSeenComposeInstructions: this.hasSeenComposeInstructions
		});
	}

	private persistCampaign() {
		saveCampaign(this.#campaignKey, {
			pid: this.pid,
			totalVotes: this.totalVotes,
			hasSeenPause: this.hasSeenPause,
			endCtaShareCompleted: this.endCtaShareCompleted,
			endCtaReviewCompleted: this.endCtaReviewCompleted,
			emailRegistered: this.emailRegistered,
			registeredEventIds: this.registeredEventIds
		});
	}

	/**
	 * Reconcile the cache against the participant the server resolved from the
	 * cookie. Called once from the root layout, before any page reads a flag.
	 *
	 * The server is the authority on identity: when it says nobody is signed in,
	 * a cache naming someone is stale and goes. It is the authority on whether
	 * the account has an email, which is all that flag means now that each
	 * Campaign remembers its own signup. It is not the authority on
	 * `demographicsCompleted`, which it can turn on but never off: leaving every
	 * About You field blank stores no demographics, so a `false` from the server
	 * means "no record of it", not "it did not happen".
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
		this.#accountEmail = participant.emailProvided;
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
		this.zipCode = '';
		this.#accountEmail = false;
		this.emailRegistered = false;
		this.demographicsCompleted = false;
		this.pid = undefined;
		this.totalVotes = 0;
		this.hasSeenPause = false;
		this.endCtaShareCompleted = false;
		this.endCtaReviewCompleted = false;
		this.registeredEventIds = [];
		this.persistAccount();
		clearCampaigns();
	}

	/** Whether to skip asking for an email on this Campaign. */
	get emailProvided() {
		return this.#accountEmail || this.emailRegistered;
	}

	get userId() {
		return this.user?.id ?? null;
	}

	get isAuthenticated() {
		return this.user !== null;
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

	/**
	 * Remember that this browser registered for an event. The attendance record
	 * on the backend is the answer; this covers the gap before the page load
	 * that reads it re-runs, and a backend that could not answer at all.
	 */
	markRegisteredForEvent(eventId: string) {
		if (!eventId || this.registeredEventIds.includes(eventId)) return;
		this.registeredEventIds = [...this.registeredEventIds, eventId];
		this.persistCampaign();
	}

	isRegisteredForEvent(eventId: string): boolean {
		return this.registeredEventIds.includes(eventId);
	}

	savePid(pid: number) {
		this.pid = pid;
		this.persistCampaign();
	}

	markDemographicsCompleted() {
		this.demographicsCompleted = true;
		// The account record is shared by every Campaign, and a preview that
		// marked it would skip About You on the live poll later.
		if (!this.#preview) this.persistAccount();
	}

	saveVoteProgress(totalVotes: number, hasSeenPause: boolean) {
		this.totalVotes = totalVotes;
		this.hasSeenPause = hasSeenPause;
		this.persistCampaign();
	}

	/**
	 * Remember the guest account a join created, and the zip it joined with.
	 * The zip is cached even though comhairle may not have kept it: the poll
	 * sends it again with every profile write.
	 */
	rememberJoin(user: User, zipCode: string) {
		this.user = user;
		this.zipCode = zipCode;
		this.persistAccount();
	}

	/**
	 * Remember a signup for updates that went through, for that Campaign only,
	 * so signing up on one Campaign does not skip another's ask. The
	 * Conversation is an argument because the one `useCampaign` last pointed at
	 * is not necessarily the one the participant signed up on.
	 */
	markEmailRegistered(conversationId: string) {
		if (conversationId === this.#conversationId || this.#preview) {
			this.emailRegistered = true;
			this.persistCampaign();
			return;
		}
		saveCampaign(conversationId, { ...loadCampaign(conversationId), emailRegistered: true });
	}
}

export const session = new Session();
