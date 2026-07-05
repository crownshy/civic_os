import { listStatementAux } from '$lib/api/aux';
import type { PolisStatementAux } from '$lib/types/aux';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, depends }) => {
	depends('open-poll:aux');

	const { region, api } = await parent();

	const stepId = region.polis_workflow_step_id;
	if (!stepId) {
		return {
			aux: [] as PolisStatementAux[],
			auxError: 'Region has no polis_workflow_step_id configured.'
		};
	}

	try {
		const aux = await listStatementAux(api, stepId);
		return { aux, auxError: null as string | null };
	} catch (e) {
		const auxError = e instanceof Error ? e.message : String(e);
		console.warn('listStatementAux failed', auxError);
		return { aux: [] as PolisStatementAux[], auxError };
	}
};
