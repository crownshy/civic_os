import { listStatementAux } from '$lib/api/aux';
import type { PolisStatementAux } from '$lib/types/aux';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, depends }) => {
	depends('open-poll:aux');

	const { campaign, api } = await parent();

	const stepId = campaign?.polis?.stepId;
	if (!stepId) {
		return {
			aux: [] as PolisStatementAux[],
			auxError: 'This conversation has no Polis workflow step.'
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
