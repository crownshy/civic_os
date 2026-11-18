import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
	MyDemographicAnswer,
	PendingQuestion,
	QuestionVersionDto
} from '@crownshy/api-client/api';
import {
	loadCampaignQuestions,
	loadPreviewQuestions,
	questionsForCampaign,
	responseValue,
	saveCampaignAnswers,
	unacknowledgedQuestions,
	type AboutYouQuestion
} from './demographics';

const NOW = '2026-01-01T00:00:00Z';

function version(id: string, changes: Partial<QuestionVersionDto> = {}): QuestionVersionDto {
	return {
		id,
		question_id: 'question',
		text: 'A question?',
		question_type: 'single_select',
		options: [{ id: `${id}-yes`, label: 'Yes', position: 0 }],
		allow_other: false,
		prefer_not_to_say: false,
		special_category: false,
		status: 'published',
		updated_at: NOW,
		version_number: 1,
		...changes
	};
}

function pending(item: QuestionVersionDto, required = false): PendingQuestion {
	return { version: item, required, skipped: false, consent: 'none' };
}

function answer(
	item: QuestionVersionDto,
	conversationId: string,
	value: unknown,
	consent: MyDemographicAnswer['consent'] = 'none'
): MyDemographicAnswer {
	return {
		version: item,
		consent,
		answer: {
			id: 'answer',
			question_id: item.question_id,
			question_version_id: item.id,
			conversation_id: conversationId,
			created_at: NOW,
			value
		}
	};
}

function question(item: QuestionVersionDto): AboutYouQuestion {
	return questionsForCampaign([pending(item)], [], 'campaign')[0];
}

afterEach(() => vi.restoreAllMocks());

describe('questionsForCampaign', () => {
	it('asks an existing version again only for another Campaign and prefills its answer', () => {
		const item = version('v1');
		const existing = answer(item, 'first', { option_ids: ['v1-yes'] });
		expect(questionsForCampaign([pending(item)], [existing], 'first')).toEqual([]);
		expect(
			questionsForCampaign([pending(item)], [existing], 'second')[0].initial.optionIds
		).toEqual(['v1-yes']);
	});

	it('asks a new version, translating previous select choices by label, not old option id', () => {
		const old = version('v1');
		const current = version('v2', { version_number: 2 });
		const existing = answer(old, 'campaign', { option_ids: ['v1-yes'] });
		const [result] = questionsForCampaign([pending(current, true)], [existing], 'campaign');
		expect(result.required).toBe(true);
		expect(result.initial.optionIds).toEqual(['v2-yes']);
		expect(result.initial.consent).toBe(false);
	});

	it('does not prefill removed or ambiguous options or a revoked special-category answer', () => {
		const old = version('v1', { special_category: true, consent_text: 'Share?' });
		const existing = answer(old, 'other', { option_ids: ['v1-yes'] }, 'declined');
		const renamed = version('v2', {
			special_category: true,
			consent_text: 'Share?',
			options: [{ id: 'v2-no', label: 'No', position: 0 }]
		});
		expect(
			questionsForCampaign([pending(renamed)], [existing], 'campaign')[0].initial.optionIds
		).toEqual([]);
		existing.consent = 'granted';
		expect(
			questionsForCampaign([pending(renamed)], [existing], 'campaign')[0].initial.optionIds
		).toEqual([]);
	});

	it('does not translate an ambiguous old option label into a new version', () => {
		const old = version('v1', {
			options: [
				{ id: 'first', label: 'Yes', position: 0 },
				{ id: 'second', label: 'Yes', position: 1 }
			]
		});
		const current = version('v2');
		const existing = answer(old, 'other', { option_ids: ['first'] });
		expect(
			questionsForCampaign([pending(current)], [existing], 'campaign')[0].initial.optionIds
		).toEqual([]);
	});

	it('respects declined consent and rejects duplicate active steps', () => {
		const item = pending(version('v1'));
		expect(questionsForCampaign([{ ...item, skipped: true }], [], 'campaign')).toEqual([]);
		expect(() => questionsForCampaign([item, item], [], 'campaign')).toThrow(
			'same demographic question'
		);
	});
});

describe('unacknowledgedQuestions', () => {
	it('asks an acknowledged version again if the Host makes it required', () => {
		const optional = question(version('v1', { question_id: 'q1' }));
		const required = { ...question(version('v2', { question_id: 'q2' })), required: true };
		expect(unacknowledgedQuestions([optional, required], ['v1', 'v2'])).toEqual([required]);
	});
});

describe('loading Campaign questions', () => {
	it('reads only live demographic steps on the active workflow in step order', async () => {
		const item = pending(version('v1'));
		const api = {
			ListConversationWorkflows: vi.fn().mockResolvedValue([
				{ id: 'old', isActive: false },
				{ id: 'active', isActive: true }
			]),
			ListConversationWorkflowSteps: vi.fn().mockResolvedValue([
				{ id: 'poll', stepOrder: 1, toolConfig: { type: 'polis' } },
				{ id: 'question', stepOrder: 3, toolConfig: { type: 'demographicquestion' } },
				{ id: 'form', stepOrder: 2, toolConfig: { type: 'demographicform' } },
				{ id: 'draft', stepOrder: 4, toolConfig: null }
			]),
			GetPendingDemographicQuestions: vi
				.fn()
				.mockResolvedValueOnce([item])
				.mockResolvedValueOnce([]),
			ListMyDemographicAnswers: vi.fn().mockResolvedValue([])
		};
		const questions = await loadCampaignQuestions(
			api as unknown as Parameters<typeof loadCampaignQuestions>[0],
			'campaign'
		);
		expect(api.ListConversationWorkflowSteps).toHaveBeenCalledWith({
			params: { conversation_id: 'campaign', workflow_id: 'active' }
		});
		expect(
			api.GetPendingDemographicQuestions.mock.calls.map(([args]) => args.params.step_id)
		).toEqual(['form', 'question']);
		expect(questions[0].version.id).toBe('v1');
	});

	it('refuses to preview an older pinned version as the latest version', async () => {
		const api = {
			ListConversationWorkflows: vi.fn().mockResolvedValue([{ id: 'workflow', isActive: true }]),
			ListConversationWorkflowSteps: vi.fn().mockResolvedValue([
				{
					stepOrder: 0,
					required: false,
					previewToolConfig: {
						type: 'demographicquestion',
						question_id: 'question',
						version: { type: 'pinned', version_id: 'v1' }
					}
				}
			]),
			GetDemographicQuestion: vi.fn().mockResolvedValue({ latest_published: version('v2') }),
			GetDemographicForm: vi.fn()
		};
		await expect(
			loadPreviewQuestions(
				api as unknown as Parameters<typeof loadPreviewQuestions>[0],
				'campaign',
				'host'
			)
		).rejects.toThrow('pinned question version');
	});

	it('previews the published pinned form in order and respects disabled entries', async () => {
		const enabled = version('v1', { question_id: 'q1' });
		const api = {
			ListConversationWorkflows: vi.fn().mockResolvedValue([{ id: 'workflow', isActive: true }]),
			ListConversationWorkflowSteps: vi.fn().mockResolvedValue([
				{
					stepOrder: 0,
					previewToolConfig: {
						type: 'demographicform',
						form_id: 'form',
						version: { type: 'pinned', version_id: 'form-v1' },
						questions: [{ question_id: 'q2', enabled: false, required: false }]
					}
				}
			]),
			GetDemographicForm: vi.fn().mockResolvedValue({
				latest_published: {
					id: 'form-v1',
					entries: [
						{ question_id: 'q2', question_version_id: 'v2', position: 0, required: false },
						{ question_id: 'q1', question_version_id: 'v1', position: 1, required: true }
					]
				}
			}),
			GetDemographicQuestion: vi.fn().mockResolvedValue({ latest_published: enabled })
		};
		const result = await loadPreviewQuestions(
			api as unknown as Parameters<typeof loadPreviewQuestions>[0],
			'campaign',
			'host'
		);
		expect(result.map(({ version, required }) => [version.id, required])).toEqual([['v1', true]]);
		expect(api.GetDemographicQuestion).toHaveBeenCalledOnce();
	});

	it('does not request past answers for a Campaign without demographic steps', async () => {
		const api = {
			ListConversationWorkflows: vi.fn().mockResolvedValue([{ id: 'workflow', isActive: true }]),
			ListConversationWorkflowSteps: vi.fn().mockResolvedValue([]),
			GetPendingDemographicQuestions: vi.fn(),
			ListMyDemographicAnswers: vi.fn()
		};
		expect(
			await loadCampaignQuestions(
				api as unknown as Parameters<typeof loadCampaignQuestions>[0],
				'campaign'
			)
		).toEqual([]);
		expect(api.ListMyDemographicAnswers).not.toHaveBeenCalled();
	});
});

describe('saving Campaign answers', () => {
	it('preserves partial saves, records explicit consent and retries only unsaved versions', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const first = question(version('v1', { question_id: 'q1' }));
		const second = question(
			version('v2', { question_id: 'q2', special_category: true, consent_text: 'Share?' })
		);
		const drafts = {
			v1: { ...first.initial, optionIds: ['v1-yes'] },
			v2: { ...second.initial, optionIds: ['v2-yes'], consent: true }
		};
		const api = {
			UpsertUserProfile: vi.fn().mockResolvedValue({}),
			SetDemographicConsent: vi.fn().mockResolvedValue({}),
			PutDemographicResponse: vi
				.fn()
				.mockResolvedValueOnce({})
				.mockRejectedValueOnce(new Error('offline'))
				.mockResolvedValueOnce({})
		};
		const client = api as unknown as Parameters<typeof saveCampaignAnswers>[0];

		const partial = await saveCampaignAnswers(
			client,
			'campaign',
			[first, second],
			drafts,
			[],
			false
		);
		expect(partial).toEqual({ success: false, saved: ['v1'] });
		expect(api.SetDemographicConsent).toHaveBeenCalledWith(
			{ granted: true },
			{ params: { version_id: 'v2' } }
		);
		const retry = await saveCampaignAnswers(
			client,
			'campaign',
			[first, second],
			drafts,
			partial.saved,
			false
		);
		expect(retry).toEqual({ success: true, saved: ['v2'] });
		expect(api.PutDemographicResponse).toHaveBeenCalledTimes(3);
		expect(api.PutDemographicResponse).toHaveBeenLastCalledWith(
			{ conversation_id: 'campaign', value: { option_ids: ['v2-yes'] } },
			{ params: { version_id: 'v2' } }
		);
	});

	it('does not write skipped answers or anything in a preview', async () => {
		const item = question(version('v1'));
		const api = {
			UpsertUserProfile: vi.fn(),
			SetDemographicConsent: vi.fn(),
			PutDemographicResponse: vi.fn()
		};
		const client = api as unknown as Parameters<typeof saveCampaignAnswers>[0];
		expect(
			await saveCampaignAnswers(client, 'campaign', [item], { v1: item.initial }, [], false)
		).toEqual({
			success: true,
			saved: []
		});
		expect(
			await saveCampaignAnswers(client, 'campaign', [item], { v1: item.initial }, [], true)
		).toEqual({
			success: true,
			saved: []
		});
		expect(api.UpsertUserProfile).not.toHaveBeenCalled();
	});

	it('locks a conflicting answer rather than suggesting that a replacement was saved', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const item = question(version('v1'));
		const api = {
			UpsertUserProfile: vi.fn().mockResolvedValue({}),
			SetDemographicConsent: vi.fn(),
			PutDemographicResponse: vi.fn().mockRejectedValue({ response: { status: 409 } })
		};
		const result = await saveCampaignAnswers(
			api as unknown as Parameters<typeof saveCampaignAnswers>[0],
			'campaign',
			[item],
			{ v1: { ...item.initial, optionIds: ['v1-yes'] } },
			[],
			false
		);
		expect(result).toEqual({ success: false, saved: ['v1'], conflict: 'v1' });
	});

	it('uses the API shapes for dates, other and prefer not to say', () => {
		const date = question(
			version('date', { question_type: 'date', date_precision: 'month', options: [] })
		);
		expect(responseValue(date, { ...date.initial, value: '2025-03' })).toBe('2025/03');
		const select = question(version('select', { allow_other: true, prefer_not_to_say: true }));
		expect(
			responseValue(select, { ...select.initial, other: true, otherText: ' Something ' })
		).toEqual({
			option_ids: [],
			other_text: 'Something'
		});
		expect(responseValue(select, { ...select.initial, preferNotToSay: true })).toEqual({
			option_ids: [],
			prefer_not_to_say: true
		});
	});
});
