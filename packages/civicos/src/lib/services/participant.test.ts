import { describe, it, expect, vi } from 'vitest';
import type { UserDto, UserProfileDto } from '@crownshy/api-client/api';
import { resolveParticipant, toParticipantSession } from './participant';

const USER: UserDto = {
	id: '11111111-1111-1111-1111-111111111111',
	authType: 'annon',
	email: null,
	emailVerified: false
};

const PROFILE: UserProfileDto = {
	id: '22222222-2222-2222-2222-222222222222',
	userId: USER.id,
	consented: true,
	zipcode: '84101',
	createdAt: '2026-01-01T00:00:00Z',
	updatedAt: '2026-01-01T00:00:00Z'
};

/** An axios rejection as zodios surfaces it. */
function httpError(status: number) {
	return Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status }
	});
}

function fakeApi(overrides: {
	CurrentUser?: () => Promise<UserDto>;
	GetUserProfile?: () => Promise<UserProfileDto>;
}) {
	return {
		CurrentUser: vi.fn(overrides.CurrentUser ?? (() => Promise.resolve(USER))),
		GetUserProfile: vi.fn(overrides.GetUserProfile ?? (() => Promise.resolve(PROFILE)))
	};
}

describe('toParticipantSession', () => {
	it('reads the zip code off the stored profile', () => {
		expect(toParticipantSession(USER, PROFILE).zipCode).toBe('84101');
	});

	it('has no zip code when the participant never saved a profile', () => {
		expect(toParticipantSession(USER, null).zipCode).toBe('');
	});

	it('does not count a zip-only profile as demographics answered', () => {
		expect(toParticipantSession(USER, PROFILE).demographicsCompleted).toBe(false);
	});

	it('counts any answered demographic field as demographics answered', () => {
		const answered = { ...PROFILE, gender: 'Non-binary' };
		expect(toParticipantSession(USER, answered).demographicsCompleted).toBe(true);
	});

	it('reports an email once the account carries one', () => {
		const withEmail = { ...USER, email: 'someone@example.com' };
		expect(toParticipantSession(withEmail, PROFILE).emailProvided).toBe(true);
	});
});

describe('resolveParticipant', () => {
	it('is anonymous without asking the backend when there is no cookie', async () => {
		const api = fakeApi({});
		await expect(resolveParticipant(api, undefined)).resolves.toEqual({
			participant: null,
			resolved: true
		});
		expect(api.CurrentUser).not.toHaveBeenCalled();
	});

	it('is anonymous when the backend rejects the cookie', async () => {
		const api = fakeApi({ CurrentUser: () => Promise.reject(httpError(401)) });
		await expect(resolveParticipant(api, 'stale')).resolves.toEqual({
			participant: null,
			resolved: true
		});
	});

	it('is unavailable when the backend cannot be reached', async () => {
		const api = fakeApi({ CurrentUser: () => Promise.reject(new Error('ECONNREFUSED')) });
		await expect(resolveParticipant(api, 'token')).resolves.toEqual({
			participant: null,
			resolved: false
		});
	});

	it('is unavailable on a backend error, so a cached session survives an outage', async () => {
		const api = fakeApi({ CurrentUser: () => Promise.reject(httpError(500)) });
		await expect(resolveParticipant(api, 'token')).resolves.toEqual({
			participant: null,
			resolved: false
		});
	});

	it('returns the participant the cookie names', async () => {
		const api = fakeApi({});
		const resolution = await resolveParticipant(api, 'token');
		expect(resolution).toEqual({
			participant: {
				userId: USER.id,
				authType: 'annon',
				email: null,
				emailVerified: false,
				zipCode: '84101',
				demographicsCompleted: false,
				emailProvided: false
			},
			resolved: true
		});
	});

	it('still returns the participant when they have no profile yet', async () => {
		const api = fakeApi({ GetUserProfile: () => Promise.reject(httpError(404)) });
		const resolution = await resolveParticipant(api, 'token');
		expect(resolution).toEqual({
			participant: expect.objectContaining({ userId: USER.id, zipCode: '' }),
			resolved: true
		});
	});
});
