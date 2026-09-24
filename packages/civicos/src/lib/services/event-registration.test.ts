import { describe, it, expect, vi } from 'vitest';
import type { EventAttendanceDto, UserDto } from '@crownshy/api-client/api';
import { registerForEvent, registrationErrorMessage } from './event-registration';

const CAMPAIGN = '11111111-1111-1111-1111-111111111111';
const EVENT = '22222222-2222-2222-2222-222222222222';

const USER: UserDto = {
	id: '33333333-3333-3333-3333-333333333333',
	authType: 'otp',
	emailVerified: false
};

/** An axios rejection as zodios surfaces it. */
function httpError(status: number, err?: string) {
	return Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status, data: err ? { err } : undefined }
	});
}

function fakeApi(overrides: { SignupOtp?: () => Promise<UserDto> } = {}) {
	return {
		SignupOtp: vi.fn(overrides.SignupOtp ?? (() => Promise.resolve(USER))),
		CreateEventAttendance: vi.fn(() => Promise.resolve({} as EventAttendanceDto))
	};
}

/** A signup that rejects with each status in turn, then succeeds. */
function signupRejecting(...statuses: number[]) {
	let call = 0;
	return () => {
		const status = statuses[call++];
		return status ? Promise.reject(httpError(status)) : Promise.resolve(USER);
	};
}

const details = {
	conversationId: CAMPAIGN,
	eventId: EVENT,
	email: 'someone@example.com',
	name: 'Jane Smith'
};

describe('registerForEvent', () => {
	it('files the attendance against the Conversation it is given', async () => {
		const api = fakeApi();

		await registerForEvent(api, details);

		expect(api.CreateEventAttendance).toHaveBeenCalledWith(
			{ role: 'participant', user_email: 'someone@example.com' },
			{ params: { conversation_id: CAMPAIGN, event_id: EVENT } }
		);
	});

	it('signs the participant up before filing the attendance', async () => {
		const api = fakeApi();

		await registerForEvent(api, details);

		expect(api.SignupOtp).toHaveBeenCalledWith({
			email: 'someone@example.com',
			username: 'Jane Smith'
		});
	});

	it('retries under the email when the name is taken as a username', async () => {
		const api = fakeApi({ SignupOtp: signupRejecting(409) });

		await registerForEvent(api, details);

		expect(api.SignupOtp).toHaveBeenNthCalledWith(2, {
			email: 'someone@example.com',
			username: 'someone@example.com'
		});
		expect(api.CreateEventAttendance).toHaveBeenCalled();
	});

	it('treats a 409 on the retry as the account already existing', async () => {
		const api = fakeApi({ SignupOtp: signupRejecting(409, 409) });

		await expect(registerForEvent(api, details)).resolves.toBeUndefined();
		expect(api.CreateEventAttendance).toHaveBeenCalled();
	});

	it('does not file an attendance when the retry fails for any other reason', async () => {
		const api = fakeApi({ SignupOtp: signupRejecting(409, 500) });

		await expect(registerForEvent(api, details)).rejects.toThrow();
		expect(api.CreateEventAttendance).not.toHaveBeenCalled();
	});

	it('does not file an attendance when signup fails for any other reason', async () => {
		const api = fakeApi({ SignupOtp: () => Promise.reject(httpError(500)) });

		await expect(registerForEvent(api, details)).rejects.toThrow();
		expect(api.CreateEventAttendance).not.toHaveBeenCalled();
	});
});

describe('registrationErrorMessage', () => {
	it('prefers the message the server sent', () => {
		expect(registrationErrorMessage(httpError(400, 'That event is full'))).toBe(
			'That event is full'
		);
	});

	it('falls back to something a participant can read', () => {
		expect(registrationErrorMessage(httpError(500))).toBe(
			'Something went wrong registering you for the event'
		);
		expect(registrationErrorMessage(new Error('boom'))).toBe(
			'Something went wrong registering you for the event'
		);
	});
});
