import type { PageLoad } from './$types';
import type { PolisReportData } from '$lib/types/report';
import type { PolisStatementAux } from '$lib/types/aux';
import { parseMetadata } from '$lib/types/metadata';

export const load: PageLoad = async ({ parent, depends, fetch }) => {
	depends('open-poll:report');

	const { region, aux, auxError, conversation } = await parent();

	// Theme dictionary lives in the conversation's metadata blob. Parse leniently
	// so a malformed blob never breaks the page — the picker just shows no themes.
	const { themes: themeDictionary, error: metadataError } = parseMetadata(conversation?.metadata);
	const conversationId = conversation?.id ?? null;

	const stepId = region.polis_workflow_step_id;
	if (!stepId) {
		return {
			reportData: null,
			auxByTid: {} as Record<number, PolisStatementAux>,
			themeDictionary,
			metadataError,
			conversationId,
			error: 'Region has no polis_workflow_step_id configured.'
		};
	}

	let reportData: PolisReportData | null = null;
	try {
		const res = await fetch(
			`/api/tools/polis/report_data?workflow_step_id=${encodeURIComponent(stepId)}`
		);
		if (!res.ok) throw new Error(`PolisGetReportData → ${res.status}`);
		reportData = (await res.json()) as PolisReportData;
	} catch (e) {
		console.error('PolisGetReportData failed', e);
	}

	const auxByTid: Record<number, PolisStatementAux> = {};
	for (const row of aux) auxByTid[row.polis_statement_id] = row;

	return {
		reportData,
		auxByTid,
		themeDictionary,
		metadataError,
		conversationId,
		error: reportData ? null : (auxError ?? 'Failed to load polis report.')
	};
};
