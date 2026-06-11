import type { PageLoad } from './$types';
import type { PolisReportData } from '$lib/types/report';

export const load: PageLoad = async ({ parent }) => {
	const { api, region } = await parent();

	const stepId = region.polis_workflow_step_id;
	if (!stepId) {
		return {
			reportData: null,
			error: 'Region has no polis_workflow_step_id configured.'
		};
	}

	try {
		// The Zodios alias `api.PolisGetReportData` declares its response as
		// z.void() upstream, so it throws on the real object payload. Bypass
		// Zodios validation by going through the underlying axios instance
		// until @crownshy/api-client types the response.
		const res = await api.axios.get<PolisReportData>('/tools/polis/report_data', {
			params: { workflow_step_id: stepId }
		});

		return { reportData: res.data, error: null };
	} catch (e) {
		const error = e instanceof Error ? e.message : String(e);
		console.error('PolisGetReportData failed', error);
		return { reportData: null, error };
	}
};
