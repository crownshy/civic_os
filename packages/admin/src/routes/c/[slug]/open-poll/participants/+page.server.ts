import type { PageServerLoad } from './$types';
import { comhairleFetch } from '$lib/server/comhairle';

interface DemographicCategory {
	category: string;
	count: number;
	value?: string | null;
}

export interface DemographicReport {
	ageRanges: DemographicCategory[];
	ethnicity: DemographicCategory[];
	gender: DemographicCategory[];
	politicalParty: DemographicCategory[];
	totalParticipants: number;
	zipcodeCounts: Record<string, number>;
}

interface WorkflowDto {
	id: string;
	name: string;
	conversationId?: string | null;
	isActive: boolean;
}

export const load: PageServerLoad = async ({ parent, cookies }) => {
	const { region } = await parent();
	const authToken = cookies.get('auth-token');
	const conversationId = region.conversationId;

	let demographics: DemographicReport | null = null;
	let error: string | null = null;

	try {
		const wfRes = await comhairleFetch(`/conversation/${conversationId}/workflow`, authToken);
		if (!wfRes.ok) throw new Error(`workflows ${wfRes.status}`);
		const workflows = (await wfRes.json()) as WorkflowDto[];
		if (!workflows.length) throw new Error('no workflows for conversation');

		const workflow = workflows[0];
		const dRes = await comhairleFetch(
			`/conversation/${conversationId}/workflow/${workflow.id}/participation_report`,
			authToken
		);
		if (!dRes.ok) throw new Error(`participation_report ${dRes.status}`);
		demographics = (await dRes.json()) as DemographicReport;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}

	return { demographics, error };
};
