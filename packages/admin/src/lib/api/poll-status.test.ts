import { describe, it, expect, vi } from 'vitest';
import { pollStatusFor } from '@civicos/shared/data/poll-status';
import { setPollStatus, type PollStatusTarget } from './poll-status';

function fakeApi() {
	return {
		UpdateConversation: vi.fn(async () => ({})),
		LaunchConversation: vi.fn(async () => ({})),
		PatchConversationMetadata: vi.fn(async () => ({})),
		PolisUpdateConfig: vi.fn(async () => ({ poll_id: 'p' }))
	};
}

function run(next: PollStatusTarget, overrides: Partial<Parameters<typeof setPollStatus>[0]> = {}) {
	const api = fakeApi();
	const promise = setPollStatus({
		api: api as unknown as Parameters<typeof setPollStatus>[0]['api'],
		conversationId: 'c1',
		next,
		pollLaunched: true,
		polisWorkflowStepId: 's1',
		reload: async () => {},
		pollIdentity: () => null,
		...overrides
	});
	return { api, promise };
}

const params = { params: { conversation_id: 'c1' } };

describe('pollStatusFor', () => {
	it('reads paused only on a live, unfinished poll', () => {
		const paused = { pollPaused: true };

		expect(pollStatusFor({ isLive: true, isComplete: false, metadata: paused })).toBe('paused');
		expect(pollStatusFor({ isLive: true, isComplete: true, metadata: paused })).toBe('complete');
		expect(pollStatusFor({ isLive: false, isComplete: false, metadata: paused })).toBe('draft');
		expect(pollStatusFor({ isLive: true, isComplete: false, metadata: null })).toBe('live');
	});
});

describe('setPollStatus', () => {
	it('pauses without taking the Campaign off live, and closes the Polis poll', async () => {
		// `is_live: false` is what made a turned-off Campaign 404 for participants.
		const { api, promise } = run('paused');
		await promise;

		expect(api.UpdateConversation).toHaveBeenCalledWith(
			{ is_live: true, is_complete: false },
			params
		);
		expect(api.PatchConversationMetadata).toHaveBeenCalledWith({ pollPaused: true }, params);
		expect(api.PolisUpdateConfig).toHaveBeenCalledWith({
			workflow_step_id: 's1',
			is_active: false
		});
	});

	it('marks a poll done and clears paused', async () => {
		const { api, promise } = run('complete');
		await promise;

		expect(api.UpdateConversation).toHaveBeenCalledWith(
			{ is_live: true, is_complete: true },
			params
		);
		expect(api.PatchConversationMetadata).toHaveBeenCalledWith({ pollPaused: false }, params);
		expect(api.PolisUpdateConfig).toHaveBeenCalledWith({
			workflow_step_id: 's1',
			is_active: false
		});
	});

	it('reopens a launched poll without launching it again', async () => {
		const { api, promise } = run('live');
		await promise;

		expect(api.LaunchConversation).not.toHaveBeenCalled();
		expect(api.UpdateConversation).toHaveBeenCalledWith(
			{ is_live: true, is_complete: false },
			params
		);
		expect(api.PolisUpdateConfig).toHaveBeenCalledWith({ workflow_step_id: 's1', is_active: true });
	});

	it('launches a draft the first time it goes live', async () => {
		const { api, promise } = run('live', { pollLaunched: false });
		await promise;

		expect(api.LaunchConversation).toHaveBeenCalledWith(undefined, params);
		expect(api.UpdateConversation).not.toHaveBeenCalled();
	});

	it('refuses to pause a draft', async () => {
		const { api, promise } = run('paused', { pollLaunched: false });

		await expect(promise).rejects.toThrow();
		expect(api.UpdateConversation).not.toHaveBeenCalled();
	});

	it('says votes are still open when Polis refuses to close', async () => {
		const { api, promise } = run('paused');
		api.PolisUpdateConfig.mockRejectedValueOnce(new Error('502'));

		await expect(promise).rejects.toThrow('still accepting votes');
	});
});
