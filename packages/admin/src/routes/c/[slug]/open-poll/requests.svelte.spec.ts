import { describe, expect, it } from 'vitest';
import { createApiClient } from '$lib/api/client';

/**
 * This layout used to fetch the Polis report by hand-building
 * `/api/tools/polis/report_data?workflow_step_id=...` (#381). This pins the
 * client call that replaced it to the same path and query, so a mis-wired alias
 * shows up here rather than as empty Setup stats and a blank Insights page.
 */

const STEP = '2b3c4d5e-6f7a-4b8c-ad9e-0f1a2b3c4d5e';

describe('open-poll layout requests', () => {
	it('reads Polis report data by workflow step', async () => {
		const api = createApiClient('http://backend/api', undefined, 'server');
		const seen: { method?: string; url?: string; params?: unknown }[] = [];
		api.axios.interceptors.request.use((config) => {
			seen.push({ method: config.method, url: config.url, params: config.params });
			return Promise.reject(new Error('stop'));
		});

		await api.PolisGetReportData({ queries: { workflow_step_id: STEP } }).catch(() => {});

		expect(seen[0]).toMatchObject({
			method: 'get',
			url: '/tools/polis/report_data',
			params: { workflow_step_id: STEP }
		});
	});
});
