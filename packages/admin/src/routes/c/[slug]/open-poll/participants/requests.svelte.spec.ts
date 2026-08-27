import { describe, expect, it } from 'vitest';
import { createApiClient } from '$lib/api/client';

/**
 * This page used to reach comhairle through a hand-rolled server fetch wrapper
 * and now goes through the generated client (#381). These pin the five calls to
 * the paths and body the wrapper used, so a mis-wired alias shows up here rather
 * than as an empty Participants tab.
 */

const CONV = '0f9b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d';
const WF = '1a2b3c4d-5e6f-4a7b-9c8d-0e1f2a3b4c5d';
const TARGET = '2b3c4d5e-6f7a-4b8c-ad9e-0f1a2b3c4d5e';

/** Record what the client would put on the wire, without sending it. */
async function capture(call: (api: ReturnType<typeof createApiClient>) => Promise<unknown>) {
	const api = createApiClient('http://backend/api', undefined, 'server');
	const seen: { method?: string; url?: string; data?: unknown }[] = [];
	api.axios.interceptors.request.use((config) => {
		seen.push({ method: config.method, url: config.url, data: config.data });
		return Promise.reject(new Error('stop'));
	});
	await call(api).catch(() => {});
	return seen[0];
}

describe('participants recruitment-target requests', () => {
	it('lists workflows on the same path the fetch wrapper used', async () => {
		const req = await capture((api) =>
			api.ListConversationWorkflows({ params: { conversation_id: CONV } })
		);
		expect(req).toMatchObject({ method: 'get', url: `/conversation/${CONV}/workflow` });
	});

	it('reads the participation report on the same path', async () => {
		const req = await capture((api) =>
			api.GetConversationWorkflowParticipationReport({
				params: { conversation_id: CONV, workflow_id: WF }
			})
		);
		expect(req).toMatchObject({
			method: 'get',
			url: `/conversation/${CONV}/workflow/${WF}/participation_report`
		});
	});

	it('lists recruitment targets on the same path', async () => {
		const req = await capture((api) =>
			api.ListRecruitmentTargets({ params: { conversation_id: CONV, workflow_id: WF } })
		);
		expect(req).toMatchObject({
			method: 'get',
			url: `/conversation/${CONV}/workflow/${WF}/recruitment_targets`
		});
	});

	it('posts an upsert with the snake_case body the API expects', async () => {
		const req = await capture((api) =>
			api.CreateRecruitmentTarget(
				{ metric: 'gender', bucket: 'woman', target_count: 12 },
				{ params: { conversation_id: CONV, workflow_id: WF } }
			)
		);
		expect(req).toMatchObject({
			method: 'post',
			url: `/conversation/${CONV}/workflow/${WF}/recruitment_targets`
		});
		// Captured pre-serialisation, so the body is still the object axios will encode.
		expect(req?.data).toEqual({
			metric: 'gender',
			bucket: 'woman',
			target_count: 12
		});
	});

	it('deletes a target by id on the same path', async () => {
		const req = await capture((api) =>
			api.DeleteRecruitmentTarget(undefined, {
				params: { conversation_id: CONV, workflow_id: WF, recruitment_target_id: TARGET }
			})
		);
		expect(req).toMatchObject({
			method: 'delete',
			url: `/conversation/${CONV}/workflow/${WF}/recruitment_targets/${TARGET}`
		});
	});
});
