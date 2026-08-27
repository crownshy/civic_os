import { listStatementAux } from '$lib/api/aux';
import type { PolisStatementAux } from '$lib/types/aux';
import type { PolisReportData } from '$lib/types/report';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, depends }) => {
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
	const reportPromise = api
		.PolisGetReportData({ queries: { workflow_step_id: stepId } })
		// The generated response is looser than what the Insights utils read:
		// `divisiveness` and `group_informed_consensus` are optional there and
		// required here, and `topics`/`subtopics` are passthrough fields the
		// schema does not declare. Converging the two shapes is its own change;
		// until then the local type stays the contract for everything downstream.
		.then((data) => data as PolisReportData)
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
