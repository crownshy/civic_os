import { describe, it, expect, vi } from 'vitest';
import type { DemographicsResponse, UserDto } from '@crownshy/api-client/api';
import { resolveParticipant, toParticipantSession } from './participant';

const USER: UserDto = {
	id: '11111111-1111-1111-1111-111111111111',
	authType: 'guest',
	email: null,
	emailVerified: false
};

function answer(questionSlug: string, value: string): DemographicsResponse {
	return { id: `${questionSlug}-row`, userId: USER.id, questionSlug, value };
}

/** What a participant has after joining: a zip and nothing else. */
const ZIP_ONLY: DemographicsResponse[] = [answer('zipcode', '84101')];

/** An axios rejection as zodios surfaces it. */
function httpError(status: number) {
	return Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status }
	});
}

function fakeApi(overrides: {
	CurrentUser?: () => Promise<UserDto>;
	GetDemographicsResponses?: () => Promise<{ records: DemographicsResponse[]; total: number }>;
}) {
	return {
		CurrentUser: vi.fn(overrides.CurrentUser ?? (() => Promise.resolve(USER))),
		GetDemographicsResponses: vi.fn(
			overrides.GetDemographicsResponses ??
				(() => Promise.resolve({ records: ZIP_ONLY, total: ZIP_ONLY.length }))
		)
	};
}

describe('toParticipantSession', () => {
	it('reads the zip code off the zipcode answer', () => {
		expect(toParticipantSession(USER, ZIP_ONLY).zipCode).toBe('84101');
	});

	it('has no zip code when the participant has answered nothing', () => {
		expect(toParticipantSession(USER, []).zipCode).toBe('');
	});

	it('does not count a zip-only participant as demographics answered', () => {
		expect(toParticipantSession(USER, ZIP_ONLY).demographicsCompleted).toBe(false);
	});

	it('counts any answered About You question as demographics answered', () => {
		const answered = [...ZIP_ONLY, answer('gender', 'Non-binary')];
		expect(toParticipantSession(USER, answered).demographicsCompleted).toBe(true);
	});

	it('ignores an About You question that was skipped', () => {
		const skipped = [...ZIP_ONLY, answer('gender', '')];
		expect(toParticipantSession(USER, skipped).demographicsCompleted).toBe(false);
	});

	it('reports an email once the account carries one', () => {
		const withEmail = { ...USER, email: 'someone@example.com' };
		expect(toParticipantSession(withEmail, ZIP_ONLY).emailProvided).toBe(true);
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
				authType: 'guest',
				email: null,
				emailVerified: false,
				zipCode: '84101',
				demographicsCompleted: false,
				emailProvided: false
			},
			resolved: true
		});
	});

	it('asks for this participant only, since the endpoint is not caller-scoped', async () => {
		const api = fakeApi({});
		await resolveParticipant(api, 'token');
		expect(api.GetDemographicsResponses).toHaveBeenCalledWith({
			queries: { user_id: USER.id }
		});
	});

	it('still returns the participant when demographics cannot be read', async () => {
		const api = fakeApi({ GetDemographicsResponses: () => Promise.reject(httpError(500)) });
		const resolution = await resolveParticipant(api, 'token');
		expect(resolution).toEqual({
			participant: expect.objectContaining({ userId: USER.id, zipCode: '' }),
			resolved: true
		});
	});
});
