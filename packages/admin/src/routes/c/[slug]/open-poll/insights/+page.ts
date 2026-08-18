import type { PageLoad } from './$types';
import type { PolisStatementAux } from '$lib/types/aux';

export const load: PageLoad = async ({ parent }) => {
	// aux + reportData are loaded once in open-poll/+layout.ts and shared with
	// the Setup tab; this page only reshapes them.
	const { reportData, aux, auxError } = await parent();

	const auxByTid: Record<number, PolisStatementAux> = {};
	for (const row of aux) auxByTid[row.polis_statement_id] = row;

	return {
		reportData,
		auxByTid,
		error: reportData ? null : (auxError ?? 'Failed to load polis report.')
	};
};
