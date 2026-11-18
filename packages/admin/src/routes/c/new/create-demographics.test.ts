import { describe, expect, it, vi } from 'vitest';
import { actions } from './+page.server';

describe('Campaign creation demographics', () => {
	it('assigns the Host before creating its demographics form', async () => {
		const api = {
			ListOrganizations: vi.fn().mockResolvedValue({ records: [{ id: 'h1', name: 'Host' }] }),
			CreateConversation: vi.fn().mockResolvedValue({ id: 'c1' }),
			CreateConversationWorkflow: vi.fn().mockResolvedValue({ id: 'w1' }),
			UpdateConversation: vi.fn().mockResolvedValue({}),
			CreateConversationWorkflowStep: vi.fn().mockResolvedValue({ id: 'poll' }),
			ListDemographicQuestions: vi.fn().mockResolvedValue([
				{
					id: 'q1',
					organization_id: null,
					tags: [],
					latest_published: { text: 'Question', question_type: 'text', options: [] }
				}
			]),
			CreateDemographicForm: vi.fn().mockRejectedValue(new Error('stop after form creation')),
			DeleteConversation: vi.fn().mockResolvedValue(undefined)
		};
		const data = new FormData();
		data.set('title', 'Campaign');
		data.set('slug', 'campaign');
		data.set('keyQuestion', 'What should we do?');
		data.set('hostId', 'h1');
		const create = actions.default;
		const event = {
			request: new Request('http://localhost/c/new', { method: 'POST', body: data }),
			params: {},
			locals: {
				api,
				isAdmin: true,
				userOrganizations: vi.fn().mockResolvedValue({
					canCreateOrganization: false,
					organizations: [
						{ organization: { id: 'h1', name: 'Host' }, isAssociated: true, canUpdate: true }
					]
				})
			}
		} as unknown as Parameters<typeof create>[0];
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			await create(event);
		} finally {
			error.mockRestore();
		}

		expect(api.UpdateConversation).toHaveBeenCalledWith(
			{ default_workflow_id: 'w1', organization_id: 'h1' },
			{ params: { conversation_id: 'c1' } }
		);
		expect(api.UpdateConversation.mock.invocationCallOrder[0]).toBeLessThan(
			api.CreateDemographicForm.mock.invocationCallOrder[0]
		);
		expect(api.DeleteConversation).toHaveBeenCalledOnce();
	});
});
