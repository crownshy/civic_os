import { describe, it, expect, vi } from 'vitest';
import type { UserDto } from '@crownshy/api-client/api';
import { knownParticipant, resolveParticipant, toParticipantSession } from './participant';

const USER: UserDto = {
	id: '11111111-1111-1111-1111-111111111111',
	authType: 'guest',
	email: null,
	emailVerified: false
};

function httpError(status: number) {
	return Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status }
	});
}

describe('resolveParticipant', () => {
	it('does not request the backend when there is no cookie', async () => {
		const api = { CurrentUser: vi.fn() };
		await expect(resolveParticipant(api, undefined)).resolves.toEqual({
			participant: null,
			resolved: true
		});
		expect(api.CurrentUser).not.toHaveBeenCalled();
	});

	it('treats a rejected cookie as signed out, but preserves the cache on an outage', async () => {
		const rejected = { CurrentUser: vi.fn().mockRejectedValue(httpError(401)) };
		const unavailable = { CurrentUser: vi.fn().mockRejectedValue(httpError(500)) };
		await expect(resolveParticipant(rejected, 'token')).resolves.toEqual({
			participant: null,
			resolved: true
		});
		await expect(resolveParticipant(unavailable, 'token')).resolves.toEqual({
			participant: null,
			resolved: false
		});
	});

	it('resolves identity without treating an answer in another Campaign as completion', async () => {
		const api = { CurrentUser: vi.fn().mockResolvedValue(USER) };
		await expect(resolveParticipant(api, 'token')).resolves.toEqual({
			participant: {
				userId: USER.id,
				authType: 'guest',
				email: null,
				username: null,
				emailVerified: false,
				zipCode: '',
				emailProvided: false
			},
			resolved: true
		});
	});
});

describe('knownParticipant', () => {
	const participant = toParticipantSession(USER);

	it('borrows the browser zip only for the same account', () => {
		expect(
			knownParticipant({ participant, resolved: true }, { userId: USER.id, zipCode: '97201' })
		).toEqual({ userId: USER.id, zipCode: '97201', isReturning: true });
		expect(
			knownParticipant(
				{ participant, resolved: true },
				{ userId: 'another-user', zipCode: '97201' }
			)
		).toEqual({ userId: USER.id, zipCode: '', isReturning: false });
	});

	it('keeps the cache during an outage, but not after sign-out', () => {
		const cache = { userId: USER.id, zipCode: '97201' };
		expect(knownParticipant({ participant: null, resolved: false }, cache)).toEqual({
			...cache,
			isReturning: true
		});
		expect(knownParticipant({ participant: null, resolved: true }, cache)).toEqual({
			userId: null,
			zipCode: '',
			isReturning: false
		});
	});
});
