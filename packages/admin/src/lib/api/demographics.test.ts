import { describe, expect, it, vi } from 'vitest';
import type { Api } from '@civicos/shared/api';
import type {
	DemographicFormDto,
	PendingQuestion,
	QuestionDto,
	ToolConfig
} from '@crownshy/api-client/api';
import {
	answerLabels,
	campaignQuestions,
	createCustomQuestion,
	editCustomQuestion,
	loadCampaignDemographics,
	readDemographicSteps,
	setQuestionEnabled,
	type DemographicsTarget,
	type WorkflowStepDto
} from './demographics';
import {
	actions as participantActions,
	load as participantLoad
} from '../../routes/c/[slug]/open-poll/participants/+page.server';

const NOW = '2026-01-01T00:00:00Z';
const target: DemographicsTarget = {
	conversationId: 'c1',
	workflowId: 'w1',
	organizationId: 'h1',
	title: 'My Campaign',
	pollLaunched: false
};
const liveTarget = { ...target, pollLaunched: true };

function question(
	id: string,
	opts: {
		org?: string | null;
		tag?: string;
		archived?: boolean;
		options?: string[];
	} = {}
): QuestionDto {
	return {
		id,
		organization_id: opts.org ?? null,
		archived_at: opts.archived ? NOW : null,
		created_at: NOW,
		draft: null,
		versions: [],
		tags: opts.tag ? [{ id: `t-${id}`, name: opts.tag, organization_id: null }] : [],
		latest_published: {
			id: `${id}-v1`,
			question_id: id,
			text: id,
			question_type: opts.options ? 'single_select' : 'text',
			options: (opts.options ?? []).map((label, position) => ({
				id: `${id}-o${position}`,
				label,
				position
			})),
			allow_other: false,
			prefer_not_to_say: false,
			special_category: false,
			status: 'published',
			updated_at: NOW,
			version_number: 1
		}
	};
}

function pending(item: QuestionDto, required = false): PendingQuestion {
	if (!item.latest_published) throw new Error('Test question has no published version.');
	return { version: item.latest_published, required, consent: 'none', skipped: false };
}

function formConfig(
	formId = 'f1',
	versionId?: string
): Extract<ToolConfig, { type: 'demographicform' }> {
	return {
		type: 'demographicform',
		form_id: formId,
		version: versionId ? { type: 'pinned', version_id: versionId } : { type: 'latest' },
		questions: []
	};
}

function questionConfig(questionId: string): Extract<ToolConfig, { type: 'demographicquestion' }> {
	return {
		type: 'demographicquestion',
		question_id: questionId,
		version: { type: 'pinned', version_id: `${questionId}-v1` }
	};
}

function step(
	id: string,
	stepOrder: number,
	previewToolConfig: ToolConfig,
	toolConfig: ToolConfig | null = null
): WorkflowStepDto {
	return {
		id,
		stepOrder,
		previewToolConfig,
		toolConfig,
		workflowId: 'w1',
		activationRule: 'manual',
		canRevisit: false,
		dataProtocol: null,
		description: '',
		isOffline: false,
		name: '',
		requestUserSharePermission: false,
		required: false
	};
}

function form(questionIds: string[], hasDraft = false): DemographicFormDto {
	const published = {
		id: 'f1-v1',
		form_id: 'f1',
		name: 'My Campaign',
		status: 'published' as const,
		updated_at: NOW,
		version_number: 1,
		entries: questionIds.map((question_id, position) => ({
			form_id: 'f1',
			form_version_id: 'f1-v1',
			position,
			question_id,
			question_text: question_id,
			required: false
		}))
	};
	return {
		id: 'f1',
		organization_id: 'h1',
		created_at: NOW,
		versions: [],
		latest_published: published,
		draft: hasDraft ? { ...published, id: 'draft', status: 'draft' } : null
	};
}

function fakeApi(
	steps: WorkflowStepDto[],
	formDto: DemographicFormDto | null = null,
	answers: Record<string, PendingQuestion[]> = {}
) {
	const state: { metadata: Record<string, unknown> } = { metadata: {} };
	const api = {
		ListConversationWorkflowSteps: vi.fn().mockResolvedValue(steps),
		GetConversation: vi.fn(async () => ({ metadata: state.metadata, organizationId: 'h1' })),
		PatchConversationMetadata: vi.fn(async (body: Record<string, unknown>) => {
			state.metadata = { ...state.metadata, ...body };
		}),
		ListDemographicQuestions: vi.fn().mockResolvedValue([]),
		ListDemographicTags: vi.fn().mockResolvedValue([{ id: 't1', name: 'Question' }]),
		CreateDemographicQuestion: vi.fn().mockResolvedValue({ id: 'q1' }),
		GetPendingDemographicQuestions: vi.fn(
			async ({ params }: { params: { step_id: string } }) => answers[params.step_id] ?? []
		),
		GetDemographicForm: vi.fn().mockResolvedValue(formDto),
		GetDemographicQuestion: vi.fn().mockResolvedValue(question('q9')),
		StartDemographicFormDraft: vi.fn().mockResolvedValue(undefined),
		UpdateDemographicFormDraft: vi.fn().mockResolvedValue(undefined),
		PublishDemographicForm: vi.fn().mockResolvedValue({ latest_published: { id: 'f1-v2' } }),
		ArchiveDemographicForm: vi.fn().mockResolvedValue(undefined),
		CreateDemographicForm: vi.fn().mockResolvedValue({ id: 'f2' }),
		StartDemographicQuestionDraft: vi.fn().mockResolvedValue(undefined),
		UpdateDemographicQuestionDraft: vi.fn().mockResolvedValue(undefined),
		PublishDemographicQuestion: vi.fn().mockResolvedValue({ latest_published: { id: 'q1-v2' } }),
		CreateConversationWorkflowStep: vi.fn().mockResolvedValue({ id: 'new', toolConfig: null }),
		UpdateConversationWorkflowStep: vi.fn().mockResolvedValue(undefined),
		DeleteConversationWorkflowStep: vi.fn().mockResolvedValue(undefined),
		CreateRecruitmentTarget: vi.fn().mockResolvedValue(undefined)
	};
	return { api, state };
}

const asApi = (api: ReturnType<typeof fakeApi>['api']) => api as unknown as Api;
const draftFormStep = step('s1', 1, formConfig());
const liveFormStep = step('s1', 1, formConfig(), formConfig('f1', 'f1-v1'));

describe('readDemographicSteps', () => {
	it('finds the form step, per-question steps and the next free order', () => {
		const result = readDemographicSteps([
			step('s0', 0, { type: 'stories', max_time: 1, to_see: 1 }),
			draftFormStep,
			step('s2', 4, questionConfig('q1'))
		]);

		expect(result.formStep).toEqual({ id: 's1', formId: 'f1', live: false });
		expect(result.questionSteps).toEqual({ q1: 's2' });
		expect(result.nextStepOrder).toBe(5);
	});

	it('uses the live form when the preview points somewhere else', () => {
		const result = readDemographicSteps([
			step('s1', 1, formConfig('preview'), formConfig('live', 'live-v1'))
		]);

		expect(result.formStep).toEqual({ id: 's1', formId: 'live', live: true });
	});
});

describe('campaignQuestions', () => {
	it('splits defaults from the Host bank and pulls Postcode out', () => {
		const result = campaignQuestions(
			[
				question('age', { tag: 'Age' }),
				question('zip', { tag: 'Postcode' }),
				question('mine', { org: 'h1' }),
				question('theirs', { org: 'h2' })
			],
			'h1',
			['mine']
		);

		expect(result.defaults.map((q) => q.id)).toEqual(['age']);
		expect(result.defaults[0].legacyKey).toBe('age');
		expect(result.custom.map((q) => [q.id, q.enabled])).toEqual([['mine', true]]);
		expect(result.zipQuestionIds).toEqual(['zip']);
	});

	it('shows an archived question only while this Campaign still asks it', () => {
		const bank = [question('old', { org: 'h1', archived: true })];
		expect(campaignQuestions(bank, 'h1', []).custom).toEqual([]);
		expect(campaignQuestions(bank, 'h1', ['old']).custom.map((q) => q.id)).toEqual(['old']);
	});
});

describe('loadCampaignDemographics', () => {
	it('allows launched edits and shows the pinned questions rather than a newer form', async () => {
		const oldQuestion = question('q1', { org: 'h1', options: ['Original'] });
		const latestQuestion = question('q1', { org: 'h1', options: ['Changed'] });
		const { api } = fakeApi([liveFormStep], form(['q2']), { s1: [pending(oldQuestion)] });
		api.ListDemographicQuestions.mockResolvedValue([latestQuestion, question('q2')]);

		const result = await loadCampaignDemographics(asApi(api), {
			organizationId: 'h1',
			workflowId: 'w1',
			pollLaunched: true,
			steps: [liveFormStep]
		});

		expect(result.lock).toBeNull();
		expect(result.custom[0]).toMatchObject({ id: 'q1', enabled: true, options: ['Original'] });
		expect(result.defaults[0].enabled).toBe(false);
	});

	it('keeps the card read-only if the live form cannot be resolved', async () => {
		const { api } = fakeApi([liveFormStep], form(['q1']));
		api.GetPendingDemographicQuestions.mockRejectedValue(new Error('unavailable'));
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const result = await loadCampaignDemographics(asApi(api), {
				organizationId: 'h1',
				workflowId: 'w1',
				pollLaunched: true,
				steps: [liveFormStep]
			});
			expect(result.lock).toBe('unreadable');
		} finally {
			warning.mockRestore();
		}
	});
});

describe('answerLabels', () => {
	const select = { optionLabels: { o1: 'Yes', o2: 'No' }, legacyKey: null };

	it('buckets a numeric age and leaves other numbers alone', () => {
		expect(answerLabels(30, { optionLabels: {}, legacyKey: 'age' })).toEqual(['25-34']);
		expect(answerLabels(30, select)).toEqual(['30']);
	});

	it('distinguishes an unavailable option from an Other answer', () => {
		expect(answerLabels({ option_ids: ['o1', 'gone'], other_text: 'Cat' }, select)).toEqual([
			'Yes',
			'Unknown option',
			'Other'
		]);
	});

	it('reads an old postcode and skips empty answers', () => {
		expect(answerLabels({ postcode: ' 12345 ' }, select)).toEqual(['12345']);
		expect(answerLabels(null, select)).toEqual([]);
	});
});

describe('setQuestionEnabled', () => {
	it('adds a pinned question step without republishing a draft form', async () => {
		const { api } = fakeApi([draftFormStep], form(['q1']));
		api.GetDemographicQuestion.mockResolvedValue(question('q2'));

		await setQuestionEnabled(asApi(api), target, 'q2', true);

		expect(api.CreateConversationWorkflowStep.mock.calls[0][0].tool_setup).toEqual(
			questionConfig('q2')
		);
		expect(api.UpdateConversationWorkflowStep.mock.calls[0][0]).toEqual({
			preview_tool_config: formConfig('f1', 'f1-v1')
		});
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
	});

	it('adds a live question without changing the existing pinned form', async () => {
		const oldQuestion = question('q1', { options: ['Original'] });
		const { api } = fakeApi([liveFormStep], form(['unrelated-latest']), {
			s1: [pending(oldQuestion, true)]
		});
		api.GetDemographicQuestion.mockResolvedValue(question('q2'));

		await setQuestionEnabled(asApi(api), liveTarget, 'q2', true);

		expect(api.CreateConversationWorkflowStep.mock.calls[0][0].tool_setup).toEqual(
			questionConfig('q2')
		);
		expect(api.UpdateConversationWorkflowStep.mock.calls[0][0]).toEqual({
			preview_tool_config: formConfig('f1', 'f1-v1'),
			tool_config: formConfig('f1', 'f1-v1')
		});
		expect(api.UpdateConversationWorkflowStep.mock.calls[1][0]).toEqual({
			tool_config: questionConfig('q2')
		});
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
		expect(api.UpdateDemographicFormDraft).not.toHaveBeenCalled();
	});

	it('disables only the selected entry while retaining the live form version', async () => {
		const { api } = fakeApi([liveFormStep], form(['q1', 'q2']), {
			s1: [pending(question('q1', { options: ['Old'] }), true), pending(question('q2'))]
		});

		await setQuestionEnabled(asApi(api), liveTarget, 'q1', false);

		const disabled = {
			...formConfig('f1', 'f1-v1'),
			questions: [{ question_id: 'q1', enabled: false, required: true }]
		};
		expect(api.UpdateConversationWorkflowStep.mock.calls[0][0]).toEqual({
			preview_tool_config: disabled,
			tool_config: disabled
		});
		expect(api.PatchConversationMetadata).not.toHaveBeenCalled();
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
		expect(api.DeleteConversationWorkflowStep).not.toHaveBeenCalled();
	});

	it('re-enables a disabled entry as a step pinned to the latest version', async () => {
		const config = {
			...formConfig('f1', 'f1-v1'),
			questions: [{ question_id: 'q1', enabled: false, required: true }]
		};
		const disabledStep = step('s1', 1, config, config);
		const latest = question('q1');
		if (!latest.latest_published) throw new Error('Test question has no published version.');
		latest.latest_published.id = 'q1-v2';
		const { api } = fakeApi([disabledStep], form(['q1']));
		api.GetDemographicQuestion.mockResolvedValue(latest);

		await setQuestionEnabled(asApi(api), liveTarget, 'q1', true);

		expect(api.CreateConversationWorkflowStep.mock.calls[0][0]).toMatchObject({
			required: true,
			tool_setup: { ...questionConfig('q1'), version: { type: 'pinned', version_id: 'q1-v2' } }
		});
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
	});

	it('creates and activates a new form when a live Campaign has none', async () => {
		const { api } = fakeApi([step('s0', 0, { type: 'stories', max_time: 1, to_see: 1 })]);

		await setQuestionEnabled(asApi(api), liveTarget, 'q2', true);

		expect(api.CreateDemographicForm).toHaveBeenCalledOnce();
		expect(api.CreateConversationWorkflowStep.mock.calls[0][0].step_order).toBe(1);
		expect(api.CreateConversationWorkflowStep.mock.calls[0][0].tool_setup).toEqual(
			formConfig('f2', 'f1-v2')
		);
		expect(api.UpdateConversationWorkflowStep.mock.calls[0][0]).toEqual({
			tool_config: formConfig('f2', 'f1-v2')
		});
	});

	it('keeps the form pinned when its last question is switched off', async () => {
		const { api } = fakeApi([liveFormStep], form(['q1']), { s1: [pending(question('q1'))] });

		await setQuestionEnabled(asApi(api), liveTarget, 'q1', false);

		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
		expect(api.DeleteConversationWorkflowStep).not.toHaveBeenCalled();
		expect(api.ArchiveDemographicForm).not.toHaveBeenCalled();
		expect(api.UpdateConversationWorkflowStep.mock.calls[0][0].tool_config).toEqual({
			...formConfig('f1', 'f1-v1'),
			questions: [{ question_id: 'q1', enabled: false, required: false }]
		});
	});

	it('disables a draft question without changing the others or creating a live config', async () => {
		const { api } = fakeApi([draftFormStep], form(['q1', 'q2']));

		await setQuestionEnabled(asApi(api), target, 'q1', false);

		expect(api.UpdateConversationWorkflowStep.mock.calls[0][0]).toEqual({
			preview_tool_config: {
				...formConfig('f1', 'f1-v1'),
				questions: [{ question_id: 'q1', enabled: false, required: false }]
			}
		});
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
	});

	it('creates a Campaign form after the last legacy step is switched off', async () => {
		const legacy = step('s5', 5, questionConfig('q1'), questionConfig('q1'));
		const { api, state } = fakeApi([legacy], null, {
			s5: [pending(question('q1', { options: ['Original'] }))]
		});

		await setQuestionEnabled(asApi(api), liveTarget, 'q1', false);
		expect(state.metadata).toEqual({});
		expect(api.PatchConversationMetadata).not.toHaveBeenCalled();

		api.ListConversationWorkflowSteps.mockResolvedValue([]);
		await setQuestionEnabled(asApi(api), liveTarget, 'q9', true);

		expect(api.CreateDemographicForm).toHaveBeenCalledOnce();
		expect(api.CreateConversationWorkflowStep.mock.calls[0][0].tool_setup).toEqual(
			formConfig('f2', 'f1-v2')
		);
		expect(api.UpdateConversationWorkflowStep.mock.calls[0][0].tool_config).toEqual(
			formConfig('f2', 'f1-v2')
		);
	});
});

describe('editCustomQuestion', () => {
	it('updates only the edited question and keeps the remaining form version pinned', async () => {
		const old = question('q1', { org: 'h1', options: ['Old'] });
		const unchanged = question('q2', { options: ['Unchanged'] });
		const { api } = fakeApi([liveFormStep], form(['q1', 'q2']), {
			s1: [pending(old, true), pending(unchanged)]
		});
		api.GetDemographicQuestion.mockResolvedValue(old);

		await editCustomQuestion(asApi(api), liveTarget, {
			id: 'q1',
			displayName: 'Updated',
			options: ['New', 'Another']
		});

		expect(api.PatchConversationMetadata).not.toHaveBeenCalled();
		expect(api.PublishDemographicQuestion).toHaveBeenCalledOnce();
		expect(api.UpdateConversationWorkflowStep.mock.calls[0][0].tool_config).toEqual({
			...formConfig('f1', 'f1-v1'),
			questions: [{ question_id: 'q1', enabled: false, required: true }]
		});
		expect(api.CreateConversationWorkflowStep.mock.calls[0][0]).toMatchObject({
			required: true,
			tool_setup: { ...questionConfig('q1'), version: { type: 'pinned', version_id: 'q1-v2' } }
		});
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
		expect(api.UpdateDemographicFormDraft).not.toHaveBeenCalled();
	});

	it('updates both configurations of a live legacy question step', async () => {
		const legacy = step('s1', 1, questionConfig('q1'), questionConfig('q1'));
		const old = question('q1', { org: 'h1', options: ['Old'] });
		const { api } = fakeApi([legacy], null, { s1: [pending(old)] });
		api.GetDemographicQuestion.mockResolvedValue(old);

		await editCustomQuestion(asApi(api), liveTarget, {
			id: 'q1',
			displayName: 'Updated',
			options: ['New', 'Another']
		});

		const newConfig = { ...questionConfig('q1'), version: { type: 'pinned', version_id: 'q1-v2' } };
		expect(api.UpdateConversationWorkflowStep.mock.calls[0][0]).toEqual({
			preview_tool_config: newConfig,
			tool_config: newConfig
		});
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
	});

	it('updates an existing question step without touching its Campaign form', async () => {
		const formWithDisabledQuestion = {
			...formConfig('f1', 'f1-v1'),
			questions: [{ question_id: 'q1', enabled: false, required: false }]
		};
		const formStep = step('s1', 1, formWithDisabledQuestion, formWithDisabledQuestion);
		const questionStep = step('s2', 2, questionConfig('q1'), questionConfig('q1'));
		const old = question('q1', { org: 'h1', options: ['Old'] });
		const { api } = fakeApi([formStep, questionStep], form(['q1', 'q2']), {
			s1: [pending(question('q2'))],
			s2: [pending(old)]
		});
		api.GetDemographicQuestion.mockResolvedValue(old);

		await editCustomQuestion(asApi(api), liveTarget, {
			id: 'q1',
			displayName: 'Updated',
			options: ['New', 'Another']
		});

		expect(api.UpdateConversationWorkflowStep).toHaveBeenCalledOnce();
		expect(api.UpdateConversationWorkflowStep.mock.calls[0][1].params.workflow_step_id).toBe('s2');
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
	});

	it('preserves the pinned question type and settings when a newer bank version differs', async () => {
		const pinned = question('q1', { org: 'h1', options: ['Old'] });
		const latest = question('q1', { org: 'h1' });
		const { api } = fakeApi([liveFormStep], form(['q1']), { s1: [pending(pinned)] });
		api.GetDemographicQuestion.mockResolvedValue(latest);

		await editCustomQuestion(asApi(api), liveTarget, {
			id: 'q1',
			displayName: 'Updated',
			options: ['New', 'Another']
		});

		expect(api.UpdateDemographicQuestionDraft.mock.calls[0][0]).toMatchObject({
			question_type: 'single_select',
			options: ['New', 'Another']
		});
	});

	it('reports when a published question cannot be applied to its Campaign', async () => {
		const { api } = fakeApi([liveFormStep], form(['q1']), {
			s1: [pending(question('q1', { org: 'h1', options: ['Old'] }))]
		});
		api.GetDemographicQuestion.mockResolvedValue(question('q1', { org: 'h1', options: ['Old'] }));
		api.UpdateConversationWorkflowStep.mockRejectedValue(new Error('unavailable'));

		await expect(
			editCustomQuestion(asApi(api), liveTarget, {
				id: 'q1',
				displayName: 'Updated',
				options: ['New', 'Another']
			})
		).rejects.toThrow('question was published, but the Campaign could not be updated');
	});

	it('restores the original form if creating the edited question step fails', async () => {
		const old = question('q1', { org: 'h1', options: ['Old'] });
		const { api } = fakeApi([liveFormStep], form(['q1']), { s1: [pending(old)] });
		api.GetDemographicQuestion.mockResolvedValue(old);
		api.CreateConversationWorkflowStep.mockRejectedValue(new Error('unavailable'));

		await expect(
			editCustomQuestion(asApi(api), liveTarget, {
				id: 'q1',
				displayName: 'Updated',
				options: ['New', 'Another']
			})
		).rejects.toThrow('question was published, but the Campaign could not be updated');
		expect(api.UpdateConversationWorkflowStep.mock.calls[1][0]).toEqual({
			preview_tool_config: formConfig(),
			tool_config: formConfig('f1', 'f1-v1')
		});
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
	});

	it('keeps other questions and Campaigns on their original versions after later changes', async () => {
		const q1 = question('q1', { org: 'h1', options: ['Old'] });
		const q1Updated = question('q1', { org: 'h1', options: ['New'] });
		const q2 = question('q2', { options: ['Original'] });
		const q2Updated = question('q2', { options: ['Newer elsewhere'] });
		const q3 = question('q3');
		if (!q1Updated.latest_published || !q2Updated.latest_published) {
			throw new Error('Test questions need published versions.');
		}
		q1Updated.latest_published.id = 'q1-v2';
		q2Updated.latest_published.id = 'q2-v2';
		const versions = { 'q1-v1': q1, 'q1-v2': q1Updated, 'q2-v1': q2, 'q3-v1': q3 };
		const bank: Record<string, QuestionDto> = { q1, q2: q2Updated, q3 };
		const formA = { ...form(['q1', 'q2']), id: 'fa' };
		const formB = { ...form(['q1']), id: 'fb' };
		const workflows: Record<string, WorkflowStepDto[]> = {
			w1: [step('a-form', 1, formConfig('fa', 'fa-v1'), formConfig('fa', 'fa-v1'))],
			w2: [step('b-form', 1, formConfig('fb', 'fb-v1'), formConfig('fb', 'fb-v1'))]
		};
		const { api } = fakeApi([]);
		api.ListConversationWorkflowSteps.mockImplementation(
			async ({ params }: { params: { workflow_id: string } }) => workflows[params.workflow_id]
		);
		api.GetDemographicForm.mockImplementation(
			async ({ params }: { params: { form_id: string } }) =>
				params.form_id === 'fa' ? formA : formB
		);
		api.GetDemographicQuestion.mockImplementation(
			async ({ params }: { params: { question_id: string } }) => bank[params.question_id]
		);
		api.PublishDemographicQuestion.mockImplementation(async () => {
			bank.q1 = q1Updated;
			return q1Updated;
		});
		api.GetPendingDemographicQuestions.mockImplementation(async ({ params }) => {
			const current = Object.values(workflows)
				.flat()
				.find((item) => item.id === params.step_id);
			const config = current?.toolConfig;
			if (!config) throw new Error('Test step has no live config.');
			if (config.type === 'demographicform') {
				const items = config.form_id === 'fa' ? [q1, q2] : [q1];
				return items
					.filter(
						(item) =>
							!config.questions.some(
								(override) => override.question_id === item.id && !override.enabled
							)
					)
					.map((item) => pending(item));
			}
			if (config.type === 'demographicquestion' && config.version.type === 'pinned') {
				const item = versions[config.version.version_id as keyof typeof versions];
				if (!item) throw new Error('Test version is missing.');
				return [pending(item)];
			}
			throw new Error('Unexpected test step.');
		});
		api.UpdateConversationWorkflowStep.mockImplementation(
			async (
				body: { preview_tool_config?: ToolConfig; tool_config?: ToolConfig },
				{ params }: { params: { workflow_step_id: string } }
			) => {
				const current = Object.values(workflows)
					.flat()
					.find((item) => item.id === params.workflow_step_id);
				if (!current) throw new Error('Test step is missing.');
				if (body.preview_tool_config) current.previewToolConfig = body.preview_tool_config;
				if (body.tool_config) current.toolConfig = body.tool_config;
			}
		);
		api.CreateConversationWorkflowStep.mockImplementation(
			async (
				body: { step_order: number; tool_setup: ToolConfig },
				{ params }: { params: { workflow_id: string } }
			) => {
				const current = step(
					`new-${params.workflow_id}-${workflows[params.workflow_id].length}`,
					body.step_order,
					body.tool_setup,
					body.tool_setup
				);
				workflows[params.workflow_id].push(current);
				return current;
			}
		);
		const versionsFor = async (workflowId: string) =>
			Object.fromEntries(
				(
					await Promise.all(
						workflows[workflowId].map((item) =>
							api.GetPendingDemographicQuestions({ params: { step_id: item.id } })
						)
					)
				).flatMap((items) => items.map(({ version }) => [version.question_id, version.id]))
			);

		await editCustomQuestion(asApi(api), liveTarget, {
			id: 'q1',
			displayName: 'Updated',
			options: ['New', 'Another']
		});
		expect(await versionsFor('w1')).toEqual({ q1: 'q1-v2', q2: 'q2-v1' });
		expect(await versionsFor('w2')).toEqual({ q1: 'q1-v1' });

		await setQuestionEnabled(
			asApi(api),
			{ ...liveTarget, conversationId: 'c2', workflowId: 'w2' },
			'q3',
			true
		);
		expect(await versionsFor('w2')).toEqual({ q1: 'q1-v1', q3: 'q3-v1' });
		expect(api.PublishDemographicForm).not.toHaveBeenCalled();
	});
});

describe('createCustomQuestion', () => {
	it('explains how to recover when adding a published question to the Campaign fails', async () => {
		const { api } = fakeApi([]);
		api.ListConversationWorkflowSteps.mockRejectedValue(new Error('unavailable'));

		await expect(
			createCustomQuestion(asApi(api), liveTarget, {
				displayName: 'Question',
				options: ['Yes', 'No']
			})
		).rejects.toThrow('question was added to the Host bank, but not to this Campaign');
		expect(api.PublishDemographicQuestion).toHaveBeenCalledOnce();
	});
});

describe('demographic goals', () => {
	it('allows a goal for an enabled question before it has any answers', async () => {
		const selected = question('q1', { org: 'h1', options: ['Yes', 'No'] });
		const { api } = fakeApi([liveFormStep], form(['q1']), { s1: [pending(selected)] });
		api.ListDemographicQuestions.mockResolvedValue([selected]);
		const data = new FormData();
		data.set('metric', 'q1');
		data.set('conversationId', 'c1');
		data.set('workflowId', 'w1');
		data.set('bucket:Yes', '10');
		const saveGoals = participantActions.saveGoals;
		const event = {
			request: new Request('http://localhost/participants?/saveGoals', {
				method: 'POST',
				body: data
			}),
			params: { slug: 'campaign' },
			locals: { api: asApi(api), isAdmin: true, userOrganizations: vi.fn() }
		} as unknown as Parameters<typeof saveGoals>[0];

		expect(await saveGoals(event)).toEqual({ success: true, metric: 'q1' });
		expect(api.CreateRecruitmentTarget.mock.calls[0][0]).toEqual({
			metric: 'q1',
			bucket: 'Yes',
			target_count: 10
		});
	});

	describe('participant results', () => {
		it('uses the active workflow and identifies unavailable historical option labels', async () => {
			const api = {
				ListConversationWorkflows: vi.fn().mockResolvedValue([
					{ id: 'old', isActive: false },
					{ id: 'active', isActive: true }
				]),
				GetConversationWorkflowParticipationReport: vi.fn().mockResolvedValue({
					total_participants: 6,
					questions: {
						q1: {
							question_id: 'q1',
							text: 'Question',
							answers: [
								{ value: { option_ids: ['current'] }, count: 1 },
								{ value: { option_ids: ['historical'] }, count: 2 },
								{ value: { option_ids: ['missing'] }, count: 3 }
							]
						}
					}
				}),
				ListRecruitmentTargets: vi.fn().mockResolvedValue([])
			};
			const event = {
				parent: async () => ({
					campaign: { id: 'c1' },
					campaignDemographics: {
						defaults: [],
						custom: [
							{
								id: 'q1',
								displayName: 'Question',
								options: ['New'],
								optionLabels: { current: 'New' },
								legacyKey: null,
								questionType: 'single_select',
								enabled: true
							}
						],
						zipQuestionIds: []
					}
				}),
				locals: { api },
				depends: vi.fn()
			} as unknown as Parameters<typeof participantLoad>[0];

			const result = await participantLoad(event);
			expect(api.GetConversationWorkflowParticipationReport).toHaveBeenCalledWith({
				params: { conversation_id: 'c1', workflow_id: 'active' }
			});
			expect(result?.questions[0]).toMatchObject({
				hasUnknownOptions: true,
				rows: [
					{ label: 'New', count: 1 },
					{ label: 'Unknown option', count: 5 }
				]
			});
		});
	});
});
