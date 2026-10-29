import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidate } from '$app/navigation';
import { enterCampaign, join, signUpForUpdates, type JoinContext } from './join';
import { session } from './session.svelte';

vi.mock('$app/navigation', () => ({ invalidate: vi.fn() }));

const CAMPAIGN = '11111111-1111-1111-1111-111111111111';
const GUEST = { id: 'guest-1', authType: 'guest', emailVerified: false };

/** An axios rejection as zodios surfaces it. */
function httpError(status: number) {
	return Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status }
	});
}

function fakeApi() {
	return {
		SignupGuestUser: vi.fn(() => Promise.resolve(GUEST)),
		ListConversationWorkflows: vi.fn(() => Promise.resolve([{ id: 'workflow-1', isActive: true }])),
		RegisterUserForConversationWorkflow: vi.fn(() => Promise.resolve({})),
		RegisterEmailForUpdates: vi.fn(() => Promise.resolve({})),
		UpsertUserProfile: vi.fn(() => Promise.resolve({})),
		CreateDemographicsResponse: vi.fn(() => Promise.resolve({})),
		UpdateDemographicsResponse: vi.fn(() => Promise.resolve({}))
	};
}

let api: ReturnType<typeof fakeApi>;

function context(overrides: Partial<JoinContext> = {}): JoinContext {
	return {
		api: api as unknown as JoinContext['api'],
		conversationId: CAMPAIGN,
		preview: false,
		...overrides
	};
}

beforeEach(() => {
	api = fakeApi();
	vi.clearAllMocks();
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	session.user = null;
	session.zipCode = '';
	session.useCampaign(CAMPAIGN);
	session.emailRegistered = false;
});

describe('join', () => {
	it('signs up a guest, registers them on the workflow and saves the zip', async () => {
		expect(await join(context(), '84101')).toBe(true);

		expect(session.userId).toBe(GUEST.id);
		expect(session.zipCode).toBe('84101');
		expect(api.RegisterUserForConversationWorkflow).toHaveBeenCalledWith(undefined, {
			params: { conversation_id: CAMPAIGN, workflow_id: 'workflow-1' }
		});
		expect(api.UpsertUserProfile).toHaveBeenCalledWith(
			expect.objectContaining({ zipcode: '84101' })
		);
		expect(invalidate).toHaveBeenCalledWith('civicos:participant');
	});

	it('fails when the guest account cannot be created', async () => {
		api.SignupGuestUser.mockRejectedValue(httpError(500));

		expect(await join(context(), '84101')).toBe(false);
		expect(session.userId).toBeNull();
		expect(invalidate).not.toHaveBeenCalled();
	});

	it('lets the participant in when the workflow registration fails', async () => {
		api.RegisterUserForConversationWorkflow.mockRejectedValue(httpError(500));

		expect(await join(context(), '84101')).toBe(true);
	});

	it('sends nothing for a preview', async () => {
		expect(await join(context({ preview: true }), '84101')).toBe(true);
		expect(api.SignupGuestUser).not.toHaveBeenCalled();
	});
});

describe('enterCampaign', () => {
	it('treats an existing registration as done', async () => {
		api.RegisterUserForConversationWorkflow.mockRejectedValue(httpError(409));

		await enterCampaign(context());
		expect(console.error).not.toHaveBeenCalled();
	});
});

describe('signUpForUpdates', () => {
	it('joins first when nobody is signed in', async () => {
		expect(await signUpForUpdates(context(), 'a@example.com')).toBe(true);

		expect(api.SignupGuestUser).toHaveBeenCalledOnce();
		expect(api.UpsertUserProfile).not.toHaveBeenCalled();
		expect(api.RegisterEmailForUpdates).toHaveBeenCalledWith(
			expect.objectContaining({ email: 'a@example.com' }),
			{ params: { conversation_id: CAMPAIGN } }
		);
		expect(session.emailProvided).toBe(true);
	});

	it('signs up a known participant without a new account', async () => {
		session.user = GUEST;

		expect(await signUpForUpdates(context(), 'a@example.com')).toBe(true);
		expect(api.SignupGuestUser).not.toHaveBeenCalled();
	});

	it('does not remember a signup that failed', async () => {
		session.user = GUEST;
		api.RegisterEmailForUpdates.mockRejectedValue(httpError(500));

		expect(await signUpForUpdates(context(), 'a@example.com')).toBe(false);
		expect(session.emailProvided).toBe(false);
	});

	it('remembers a preview signup without sending it', async () => {
		expect(await signUpForUpdates(context({ preview: true }), 'a@example.com')).toBe(true);
		expect(api.RegisterEmailForUpdates).not.toHaveBeenCalled();
	});
});
