import { describe, expect, it } from 'vitest';
import { createApiClient } from '@crownshy/api-client/client';

/**
 * The report page used to build these three URLs by hand and fetch them through
 * the proxy (#119, #381). These pin the client calls that replaced them to the
 * same paths and query string, so a mis-wired alias shows up here rather than as
 * an empty report.
 */

const CONV = '0f9b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d';
const WF = '1a2b3c4d-5e6f-4a7b-9c8d-0e1f2a3b4c5d';
const STEP = '2b3c4d5e-6f7a-4b8c-ad9e-0f1a2b3c4d5e';

type Api = ReturnType<typeof createApiClient>;

/** Record what the client would put on the wire, without sending it. */
async function capture(call: (api: Api) => Promise<unknown>) {
	const api = createApiClient('http://backend/api', undefined, 'server');
	const seen: { method?: string; url?: string; params?: unknown }[] = [];
	api.axios.interceptors.request.use((config) => {
		seen.push({ method: config.method, url: config.url, params: config.params });
		return Promise.reject(new Error('stop'));
	});
	await call(api).catch(() => {});
	return seen[0];
}

describe('report page requests', () => {
	it('lists the conversation workflows', async () => {
		const req = await capture((api) =>
			api.ListConversationWorkflows({ params: { conversation_id: CONV } })
		);
		expect(req).toMatchObject({ method: 'get', url: `/conversation/${CONV}/workflow` });
	});

	it('reads Polis report data by workflow step', async () => {
		const req = await capture((api) =>
			api.PolisGetReportData({ queries: { workflow_step_id: STEP } })
		);
		expect(req).toMatchObject({
			method: 'get',
			url: '/tools/polis/report_data',
			params: { workflow_step_id: STEP }
		});
	});

	it('reads the participation report for demographics', async () => {
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
});
