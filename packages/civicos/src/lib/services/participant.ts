import type { ApiClient, UserDto, UserProfileDto } from '@crownshy/api-client/api';
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
	/** From the stored profile. Empty for an email-only signup, which never gives one. */
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

type ParticipantApi = Pick<ApiClient, 'CurrentUser' | 'GetUserProfile'>;

/**
 * A profile exists from the moment a zip is saved, so its presence proves
 * nothing. Only an answered demographic field means the About You screen was
 * filled in.
 */
function hasDemographics(profile: UserProfileDto | null): boolean {
	if (!profile) return false;
	return Boolean(profile.age || profile.ethnicity || profile.gender || profile.politicalParty);
}

/** Flatten the two backend records into the shape the app reasons about. */
export function toParticipantSession(
	user: UserDto,
	profile: UserProfileDto | null
): ParticipantSession {
	return {
		userId: user.id,
		authType: user.authType,
		email: user.email ?? null,
		emailVerified: user.emailVerified,
		zipCode: profile?.zipcode ?? '',
		demographicsCompleted: hasDemographics(profile),
		emailProvided: Boolean(user.email)
	};
}

/**
 * Identify the participant behind an `auth-token` cookie.
 *
 * The two calls run together because the profile is wanted for every signed-in
 * participant and neither depends on the other.
 */
export async function resolveParticipant(
	api: ParticipantApi,
	authToken: string | undefined
): Promise<ParticipantResolution> {
	if (!authToken) return { participant: null, resolved: true };

	const [user, profile] = await Promise.allSettled([api.CurrentUser(), api.GetUserProfile()]);

	if (user.status === 'rejected') {
		const status = httpStatusOf(user.reason);
		// A rejected cookie is an answer. Anything else means we did not get one.
		if (status === 401 || status === 403) return { participant: null, resolved: true };
		console.error('[Participant] Could not resolve the session:', user.reason);
		return { participant: null, resolved: false };
	}

	// A rejected profile is ordinary: the account exists, the profile does not yet.
	return {
		participant: toParticipantSession(
			user.value,
			profile.status === 'fulfilled' ? profile.value : null
		),
		resolved: true
	};
}
