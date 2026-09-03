/**
 * The localStorage cache behind `session.svelte.ts`.
 *
 * A cache, not the source of truth. Identity comes from the `auth-token`
 * cookie, which the root layout resolves during SSR (`participant.ts`). What is
 * kept here is only what comhairle has no field for: Polis's `pid`, the vote
 * pacing counters and the end-of-flow CTA flags. Per-user progress on the
 * backend is a status per workflow step, with nowhere to put a participant id
 * or a count.
 *
 * Two records, because the things being remembered have two different
 * lifetimes. The account record is about the person and reads the same wherever
 * they go. The campaign record is about one poll and means nothing outside it,
 * so it is keyed by Conversation id. localStorage is keyed by origin and an
 * origin is a Place, so a single blob made a Place serving two Campaigns share
 * one `pid` between them: the second poll would resume against the first's
 * votes. ADR 0008 says that is where the model is heading.
 */

export interface AccountRecord {
	userId?: string;
	emailProvided: boolean;
	zipCode: string;
	demographicsCompleted: boolean;
	/**
	 * Preferences of this browser rather than of the account, so they survive a
	 * sign-out. Kept in this record because they are equally campaign-agnostic.
	 */
	hasAgreedToTos: boolean;
	hasSeenComposeInstructions: boolean;
}

export interface CampaignRecord {
	/** Polis's participant id, valid only against this Campaign's poll. */
	pid?: number;
	totalVotes: number;
	hasSeenPause: boolean;
	endCtaShareCompleted: boolean;
	endCtaReviewCompleted: boolean;
	/**
	 * Events of this Campaign this browser has registered for. A cache in front
	 * of the attendance list, which is the actual record (#420): it covers the
	 * moment between registering and the load re-running, and a backend that
	 * cannot answer. An absent entry is not evidence of anything.
	 */
	registeredEventIds: string[];
}

/**
 * Bumping this discards every stored record. Do it whenever a field changes
 * meaning rather than only when one is added: a reader that takes whatever
 * happens to line up is how stale data reads as valid.
 */
const SCHEMA_VERSION = 1;

const ACCOUNT_KEY = 'civic-os-account';
const CAMPAIGN_PREFIX = 'civic-os-campaign:';

/** The single pre-#418 blob. Read once by `migrateLegacy`, then removed. */
const LEGACY_KEY = 'civic-os-session';

const campaignKey = (conversationId: string) => `${CAMPAIGN_PREFIX}${conversationId}`;

function emptyAccount(): AccountRecord {
	return {
		emailProvided: false,
		zipCode: '',
		demographicsCompleted: false,
		hasAgreedToTos: false,
		hasSeenComposeInstructions: false
	};
}

export function emptyCampaign(): CampaignRecord {
	return {
		totalVotes: 0,
		hasSeenPause: false,
		endCtaShareCompleted: false,
		endCtaReviewCompleted: false,
		registeredEventIds: []
	};
}

/**
 * Absent during SSR, and a throwing getter in Safari with cookies disabled, so
 * every caller has to cope with not having it.
 */
function storage(): Storage | null {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		return null;
	}
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function read(key: string): Record<string, unknown> | null {
	const store = storage();
	if (!store) return null;

	let parsed: Record<string, unknown> | null;
	try {
		const raw = store.getItem(key);
		if (!raw) return null;
		parsed = asRecord(JSON.parse(raw));
	} catch {
		return null;
	}

	// Any other version is a different shape. Dropping it costs a participant
	// their pacing counters; reading it field by field costs whoever ships the
	// next shape change a bug that only reproduces for existing browsers.
	if (!parsed || parsed.v !== SCHEMA_VERSION) {
		store.removeItem(key);
		return null;
	}
	return parsed;
}

function write(key: string, value: object): void {
	try {
		storage()?.setItem(key, JSON.stringify({ v: SCHEMA_VERSION, ...value }));
	} catch {
		// A full or blocked quota costs the cache, not the session: the cookie
		// still identifies the participant on the next load.
	}
}

const asBoolean = (value: unknown): boolean => value === true;
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
const asCount = (value: unknown): number =>
	typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
const asStringList = (value: unknown): string[] =>
	Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v !== '') : [];
const asOptionalNumber = (value: unknown): number | undefined =>
	typeof value === 'number' && Number.isFinite(value) ? value : undefined;

function toAccount(raw: Record<string, unknown>): AccountRecord {
	return {
		userId: typeof raw.userId === 'string' && raw.userId ? raw.userId : undefined,
		emailProvided: asBoolean(raw.emailProvided),
		zipCode: asString(raw.zipCode),
		demographicsCompleted: asBoolean(raw.demographicsCompleted),
		hasAgreedToTos: asBoolean(raw.hasAgreedToTos),
		hasSeenComposeInstructions: asBoolean(raw.hasSeenComposeInstructions)
	};
}

function toCampaign(raw: Record<string, unknown>): CampaignRecord {
	return {
		pid: asOptionalNumber(raw.pid),
		totalVotes: asCount(raw.totalVotes),
		hasSeenPause: asBoolean(raw.hasSeenPause),
		endCtaShareCompleted: asBoolean(raw.endCtaShareCompleted),
		endCtaReviewCompleted: asBoolean(raw.endCtaReviewCompleted),
		registeredEventIds: asStringList(raw.registeredEventIds)
	};
}

export function loadAccount(): AccountRecord {
	migrateLegacy();
	const raw = read(ACCOUNT_KEY);
	return raw ? toAccount(raw) : emptyAccount();
}

export function saveAccount(record: AccountRecord): void {
	write(ACCOUNT_KEY, record);
}

export function loadCampaign(conversationId: string): CampaignRecord {
	if (!conversationId) return emptyCampaign();
	const raw = read(campaignKey(conversationId));
	return raw ? toCampaign(raw) : emptyCampaign();
}

export function saveCampaign(conversationId: string, record: CampaignRecord): void {
	if (!conversationId) return;
	write(campaignKey(conversationId), record);
}

/**
 * Drop every campaign record. Called when the cookie stops naming anyone: the
 * progress under each key belongs to the account that just went away, `pid`
 * included, and a new anonymous account gets a new Polis xid.
 */
export function clearCampaigns(): void {
	const store = storage();
	if (!store) return;

	const keys: string[] = [];
	for (let i = 0; i < store.length; i++) {
		const key = store.key(i);
		if (key?.startsWith(CAMPAIGN_PREFIX)) keys.push(key);
	}
	for (const key of keys) store.removeItem(key);
}

/**
 * Carry a pre-#418 blob over, once.
 *
 * Dropping it instead would cost everyone mid-poll their vote pacing and
 * re-show the CTAs they had dismissed. The blob's own `conversationId` says
 * which Campaign the progress half belongs to; without one there is nothing to
 * scope it by, so only the account half survives.
 *
 * Delete this once no live browser can still be holding the old key.
 */
function migrateLegacy(): void {
	const store = storage();
	if (!store) return;

	let legacy: Record<string, unknown> | null;
	try {
		const raw = store.getItem(LEGACY_KEY);
		if (!raw) return;
		legacy = asRecord(JSON.parse(raw));
	} catch {
		legacy = null;
	}
	store.removeItem(LEGACY_KEY);
	// Only the unversioned shape is the one this knows how to read. Anything
	// carrying a `v` was written by a later scheme under a key it has no claim on.
	if (!legacy || legacy.v !== undefined) return;

	// Never over an existing record: this browser has already been through the
	// new flow and the blob is the older answer.
	if (!read(ACCOUNT_KEY)) saveAccount(toAccount(legacy));

	const conversationId = asString(legacy.conversationId);
	if (conversationId && !read(campaignKey(conversationId))) {
		saveCampaign(conversationId, toCampaign(legacy));
	}
}
