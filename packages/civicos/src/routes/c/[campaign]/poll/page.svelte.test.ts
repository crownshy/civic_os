import { beforeEach, expect, it, vi } from 'vitest';
import { page as browserPage } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';

const mocks = vi.hoisted(() => ({
	enterCampaign: vi.fn(),
	invalidate: vi.fn()
}));

vi.mock('$app/navigation', async (importOriginal) => ({
	...(await importOriginal<typeof import('$app/navigation')>()),
	invalidate: mocks.invalidate
}));

vi.mock('$lib/services/join', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/services/join')>()),
	enterCampaign: mocks.enterCampaign
}));

vi.mock('$lib/services/polis-api.svelte', () => ({
	default: class {
		ready = true;
		loading = false;
		error = '';
		participantId = undefined;
		remaining = 1;
		currentStatement = { tid: 1, txt: 'A statement' };
		start() {}
	}
}));

vi.mock('$app/state', () => ({
	page: {
		params: { campaign: 'second' },
		url: new URL('http://localhost/c/second/poll'),
		data: {
			knownParticipant: { userId: 'participant', zipCode: '84101', isReturning: true },
			joinContext: { conversationId: 'second', preview: false, api: {} },
			campaign: {
				id: 'second',
				slug: 'second',
				placeName: 'Test',
				poll: {
					polisId: 'poll',
					polisUrl: 'http://localhost',
					question: 'What do you think?',
					workflowStepId: 'poll-step'
				}
			},
			participation: {
				asks: { contribute: false, email: false, feedback: false, share: false }
			},
			aboutYouQuestions: [
				{
					version: {
						id: '11111111-1111-1111-1111-111111111111',
						question_id: 'question',
						text: 'A question',
						question_type: 'text',
						options: [],
						allow_other: false,
						prefer_not_to_say: false,
						special_category: false,
						status: 'published',
						updated_at: '2026-01-01T00:00:00Z',
						version_number: 1
					},
					required: false,
					initial: {
						value: '',
						optionIds: [],
						other: false,
						otherText: '',
						preferNotToSay: false,
						consent: false
					}
				}
			],
			preview: false,
			demographicsError: null,
			hostCopy: { context: '', whatsNext: '' },
			api: {},
			participantResolved: true
		}
	}
}));

import PollPage from './+page.svelte';

beforeEach(() => {
	vi.clearAllMocks();
	mocks.enterCampaign.mockResolvedValue(undefined);
	mocks.invalidate.mockResolvedValue(undefined);
});

it('registers a returning participant on this Campaign before refreshing its questions', async () => {
	await render(PollPage);
	await browserPage.getByRole('button', { name: 'END' }).click();
	await expect.element(browserPage.getByText('A question')).toBeVisible();
	expect(mocks.enterCampaign).toHaveBeenCalledWith(
		expect.objectContaining({ conversationId: 'second' })
	);
	expect(mocks.invalidate).toHaveBeenCalledWith('civicos:demographics');
	expect(mocks.enterCampaign.mock.invocationCallOrder[0]).toBeLessThan(
		mocks.invalidate.mock.invocationCallOrder[0]
	);
});
