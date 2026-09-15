import type { ApiClient, DemographicsResponse, UserDto } from '@crownshy/api-client/api';
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
	emailVerified: boolean;
	/** Empty for an email-only signup, which never gives one. */
	zipCode: string;
	demographicsCompleted: boolean;
	emailProvided: boolean;
}

/**
 * What the server worked out from the cookie.
 *
 * `resolved: false` is deliberately not the same as an absent participant: a
 * backend that is down must not read as "nobody is signed in", because callers
 * act on that by clearing the cached session and bouncing people off
 * `/contribute`.
 */
export interface ParticipantResolution {
	participant: ParticipantSession | null;
	/** Whether the backend actually answered. */
	resolved: boolean;
}

type ParticipantApi = Pick<ApiClient, 'CurrentUser' | 'GetDemographicsResponses'>;

const ZIPCODE_SLUG = 'zipcode';

/**
 * The About You screen's questions. Zip is deliberately not one of them: it is
 * collected at join, so counting it would mark every joiner as done.
 */
const ABOUT_YOU_SLUGS = ['age', 'ethnicity', 'gender', 'political_party'];

function answerFor(responses: DemographicsResponse[], slug: string): string {
	return String(responses.find((r) => r.questionSlug === slug)?.value ?? '');
}

/**
 * A participant has a demographics row from the moment their zip is saved, so
 * the row's presence proves nothing. Only an answered About You question means
 * the screen was filled in.
 */
function hasDemographics(responses: DemographicsResponse[]): boolean {
	return responses.some((r) => ABOUT_YOU_SLUGS.includes(r.questionSlug) && Boolean(r.value));
}

/** Flatten the two backend records into the shape the app reasons about. */
export function toParticipantSession(
	user: UserDto,
	responses: DemographicsResponse[]
): ParticipantSession {
	return {
		userId: user.id,
		authType: user.authType,
		email: user.email ?? null,
		emailVerified: user.emailVerified,
		zipCode: answerFor(responses, ZIPCODE_SLUG),
		demographicsCompleted: hasDemographics(responses),
		emailProvided: Boolean(user.email)
	};
}

/**
 * Identify the participant behind an `auth-token` cookie.
 *
 * Two round trips rather than one: demographics are keyed by user id, and
 * `/demographics/responses` is not scoped to the caller, so the id has to be in
 * hand before the second call can be asked for this participant's rows alone.
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

	// Ordinary for someone who has answered nothing yet, so a failure here is
	// not a failure to resolve: it costs the zip, which the caller falls back to
	// its localStorage copy for.
	let responses: DemographicsResponse[] = [];
	try {
		const page = await api.GetDemographicsResponses({ queries: { user_id: user.id } });
		responses = page.records;
	} catch (e) {
		console.error('[Participant] Could not read demographics:', e);
	}

	return { participant: toParticipantSession(user, responses), resolved: true };
}
