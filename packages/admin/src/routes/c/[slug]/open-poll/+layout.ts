import { listStatementAux } from '$lib/api/aux';
import type { PolisStatementAux } from '$lib/types/aux';
import type { PolisReportData } from '$lib/types/report';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, depends, fetch }) => {
	depends('open-poll:aux');
	depends('open-poll:report');

	const { campaign, api } = await parent();

	const stepId = campaign.polisWorkflowStepId;
	if (!stepId) {
		return {
			aux: [] as PolisStatementAux[],
			auxError: 'This conversation has no Polis workflow step.',
			reportData: null as PolisReportData | null
		};
	}

	// Report data is loaded here rather than per-page: Setup needs it for the
	// top-line stats and Insights needs it for everything, so a shared parent
	// keeps it to one request per navigation.
	const reportPromise = fetch(
		`/api/tools/polis/report_data?workflow_step_id=${encodeURIComponent(stepId)}`
	)
		.then((res) => {
			if (!res.ok) throw new Error(`PolisGetReportData → ${res.status}`);
			return res.json() as Promise<PolisReportData>;
		})
		.catch((e) => {
			console.error('PolisGetReportData failed', e);
			return null;
		});

	const auxPromise = listStatementAux(api, stepId).catch((e) => {
		const message = e instanceof Error ? e.message : String(e);
		console.warn('listStatementAux failed', message);
		return message;
	});

	const [reportData, auxResult] = await Promise.all([reportPromise, auxPromise]);
	const auxFailed = typeof auxResult === 'string';

	return {
		aux: auxFailed ? ([] as PolisStatementAux[]) : auxResult,
		auxError: auxFailed ? auxResult : (null as string | null),
		reportData
	};
};
