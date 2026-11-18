import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	serverApi: vi.fn(),
	loadCampaignQuestions: vi.fn(),
	loadPreviewQuestions: vi.fn()
}));

vi.mock('@civicos/shared/api', () => ({ serverApi: mocks.serverApi }));
vi.mock('$lib/services/demographics', () => ({
	loadCampaignQuestions: mocks.loadCampaignQuestions,
	loadPreviewQuestions: mocks.loadPreviewQuestions
}));

const { load } = await import('./+page.server');
const api = {};

function event(preview = false) {
	return {
		url: new URL('http://localhost/c/example/poll'),
		cookies: {
			get: (name: string) => (name === 'auth-token' ? 'participant-token' : 'host-token')
		},
		depends: vi.fn(),
		parent: async () => ({
			campaign: { id: 'campaign' },
			preview,
			previewOrganizationId: 'host',
			participant: { userId: 'user' },
			participantResolved: true
		})
	} as unknown as Parameters<typeof load>[0];
}

beforeEach(() => {
	vi.resetAllMocks();
	mocks.serverApi.mockReturnValue(api);
});

describe('poll question load', () => {
	it('loads live questions with the participant session', async () => {
		mocks.loadCampaignQuestions.mockResolvedValue([{ version: { id: 'v1' } }]);
		const result = await load(event());
		expect(mocks.serverApi).toHaveBeenCalledWith(expect.any(URL), 'participant-token');
		expect(mocks.loadCampaignQuestions).toHaveBeenCalledWith(api, 'campaign');
		expect(result).toEqual({
			aboutYouQuestions: [{ version: { id: 'v1' } }],
			demographicsError: null
		});
	});

	it('uses the Host session for a draft preview', async () => {
		mocks.loadPreviewQuestions.mockResolvedValue([]);
		await load(event(true));
		expect(mocks.serverApi).toHaveBeenCalledWith(expect.any(URL), 'host-token');
		expect(mocks.loadPreviewQuestions).toHaveBeenCalledWith(api, 'campaign', 'host');
	});

	it('reports a failed read instead of silently substituting different questions', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		mocks.loadCampaignQuestions.mockRejectedValue(new Error('unavailable'));
		expect(await load(event())).toMatchObject({
			aboutYouQuestions: [],
			demographicsError: expect.stringContaining('could not load')
		});
		vi.restoreAllMocks();
	});
});
