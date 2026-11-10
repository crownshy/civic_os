import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidate } from '$app/navigation';
import { joinWithCode, joinWithEmail, type EmailJoinContext } from './email-join';
import { session } from './session.svelte';

vi.mock('$app/navigation', () => ({ invalidate: vi.fn() }));

const CAMPAIGN = '11111111-1111-1111-1111-111111111111';
const MEMBER = { id: 'member-1', authType: 'otp', email: 'a@example.com', emailVerified: false };

function httpError(status: number) {
	return Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status }
	});
}

function fakeApi() {
	return {
		SignupOtp: vi.fn(() => Promise.resolve(MEMBER)),
		CreateOtp: vi.fn(() => Promise.resolve(undefined)),
		LoginOtpUser: vi.fn(() => Promise.resolve(MEMBER)),
		SignupGuestUser: vi.fn(),
		ListConversationWorkflows: vi.fn(() => Promise.resolve([{ id: 'workflow-1', isActive: true }])),
		RegisterUserForConversationWorkflow: vi.fn(() => Promise.resolve({})),
		RegisterEmailForUpdates: vi.fn(),
		UpsertUserProfile: vi.fn(() => Promise.resolve({})),
		CreateDemographicsResponse: vi.fn(),
		UpdateDemographicsResponse: vi.fn()
	};
}

let api: ReturnType<typeof fakeApi>;

function context(overrides: Partial<EmailJoinContext> = {}): EmailJoinContext {
	return {
		api: api as unknown as EmailJoinContext['api'],
		conversationId: CAMPAIGN,
		preview: false,
		...overrides
	};
}

beforeEach(() => {
	api = fakeApi();
	vi.clearAllMocks();
	vi.spyOn(console, 'error').mockImplementation(() => {});
	session.user = null;
	session.zipCode = '';
	session.useCampaign(CAMPAIGN);
});

describe('joinWithEmail', () => {
	it('signs a new email in, puts it on the Campaign and saves the zip', async () => {
		expect(await joinWithEmail(context(), 'a@example.com', '84101')).toBe('joined');

		expect(api.SignupOtp).toHaveBeenCalledWith({
			email: 'a@example.com',
			username: 'a@example.com'
		});
		expect(session.userId).toBe(MEMBER.id);
		expect(session.emailProvided).toBe(true);
		expect(api.RegisterUserForConversationWorkflow).toHaveBeenCalledOnce();
		expect(api.UpsertUserProfile).toHaveBeenCalledWith(
			expect.objectContaining({ zipcode: '84101' })
		);
		expect(invalidate).toHaveBeenCalledWith('civicos:participant');
	});

	it('sends a login code when the email already has an account', async () => {
		api.SignupOtp.mockRejectedValue(httpError(409));

		expect(await joinWithEmail(context(), 'a@example.com', '84101')).toBe('code-sent');
		expect(api.CreateOtp).toHaveBeenCalledWith({ email: 'a@example.com' });
		expect(session.userId).toBeNull();
	});

	it('fails on anything else', async () => {
		api.SignupOtp.mockRejectedValue(httpError(500));

		expect(await joinWithEmail(context(), 'a@example.com', '84101')).toBe('failed');
		expect(api.CreateOtp).not.toHaveBeenCalled();
	});

	it('sends nothing for a preview', async () => {
		expect(await joinWithEmail(context({ preview: true }), 'a@example.com', '84101')).toBe(
			'joined'
		);
		expect(api.SignupOtp).not.toHaveBeenCalled();
	});
});

describe('joinWithCode', () => {
	it('signs in with the emailed code and joins', async () => {
		expect(await joinWithCode(context(), 'a@example.com', '123456', '84101')).toBe(true);

		expect(api.LoginOtpUser).toHaveBeenCalledWith({ email: 'a@example.com', code: '123456' });
		expect(session.userId).toBe(MEMBER.id);
		expect(invalidate).toHaveBeenCalledWith('civicos:participant');
	});

	it('fails on a wrong code without signing anyone in', async () => {
		api.LoginOtpUser.mockRejectedValue(httpError(401));

		expect(await joinWithCode(context(), 'a@example.com', '000000', '84101')).toBe(false);
		expect(session.userId).toBeNull();
	});
});
