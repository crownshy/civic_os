import type { ApiClient, UserDto } from '@crownshy/api-client/api';
import { httpStatusOf } from '$lib/utils/http';

/**
 * The participant as the backend knows them, resolved from the `auth-token`
 * cookie during SSR rather than read out of localStorage after hydration.
 *
 * Everything here has a server-side answer. Polis's `pid`, vote counts and the
 * end-of-flow CTA flags do not, so they stay in the localStorage cache that
 * `session.svelte.ts` keeps.
 */
export interface ParticipantSession {
	userId: string;
	authType: UserDto['authType'];
	email: string | null;
	/** Their name, for an account made by email. Comhairle keeps it as the username. */
	username: string | null;
	emailVerified: boolean;
	/** Empty for an email-only signup, which never gives one. */
	zipCode: string;
	emailProvided: boolean;
}

/**
 * What the server worked out from the cookie.
 *
 * `resolved: false` is deliberately not the same as an absent participant: a
 * backend that is down must not read as "nobody is signed in", because callers
 * act on that by clearing the cached session and bouncing people off
 * `/poll`.
 */
export interface ParticipantResolution {
	participant: ParticipantSession | null;
	/** Whether the backend actually answered. */
	resolved: boolean;
}

/** Who a page is talking to: the server's answer, or the cache where it has none. */
export interface KnownParticipant {
	/** Null for nobody, which is not the same as a backend that could not say. */
	userId: string | null;
	zipCode: string;
	/** Joined with a zip before, so the landing page offers CONTINUE. */
	isReturning: boolean;
}

/** What this browser's cache remembers about the participant. */
export interface CachedParticipant {
	userId: string | null;
	zipCode: string;
}

/**
 * Settle the server's answer against this browser's cache, once, so pages do
 * not each decide which one wins.
 *
 * The cache stands in only where the server has no answer to disagree with:
 * the gate on the poll reads the server and nothing else, and anything the
 * landing page let through that the gate turns away is a silent redirect back.
 * The zip is the exception. Comhairle cannot keep it yet (see `join.ts`), so a
 * participant the server knows still borrows the cached zip to fill the field.
 */
export function knownParticipant(
	{ participant, resolved }: ParticipantResolution,
	cached: CachedParticipant
): KnownParticipant {
	if (!resolved) {
		return {
			userId: cached.userId,
			zipCode: cached.zipCode,
			isReturning: cached.userId !== null && !!cached.zipCode
		};
	}
	if (!participant) return { userId: null, zipCode: '', isReturning: false };
	const zipCode =
		participant.zipCode || (cached.userId === participant.userId ? cached.zipCode : '');
	return {
		userId: participant.userId,
		zipCode,
		isReturning: !!zipCode
	};
}

type ParticipantApi = Pick<ApiClient, 'CurrentUser'>;

/** Flatten the account record into the shape the app reasons about. */
export function toParticipantSession(user: UserDto): ParticipantSession {
	return {
		userId: user.id,
		authType: user.authType,
		email: user.email ?? null,
		username: user.username ?? null,
		emailVerified: user.emailVerified,
		zipCode: '',
		emailProvided: Boolean(user.email)
	};
}

/**
 * Identify the participant behind an `auth-token` cookie.
 *
 * The current API cannot identify a participant-writable Postcode question, so
 * callers use the browser's cached zip until the API supports that lookup.
 */
export async function resolveParticipant(
	api: ParticipantApi,
	authToken: string | undefined
): Promise<ParticipantResolution> {
	if (!authToken) return { participant: null, resolved: true };

	let user: UserDto;
	try {
		user = await api.CurrentUser();
	} catch (e) {
		const status = httpStatusOf(e);
		// A rejected cookie is an answer. Anything else means we did not get one.
		if (status === 401 || status === 403) return { participant: null, resolved: true };
		console.error('[Participant] Could not resolve the session:', e);
		return { participant: null, resolved: false };
	}

	return { participant: toParticipantSession(user), resolved: true };
}
