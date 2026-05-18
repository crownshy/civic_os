import type { DemographicReport, WorkflowDto } from '@crownshy/api-client/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {

	const region = locals.region;
	const conversationId = region.conversationId;

	console.log({ region, conversationId })

	let demographics: DemographicReport | null = null;

	async function fetchApi<T>(path: string): Promise<T> {
		// const apiUrl = `${url.origin}/api${path}`;
		const apiUrl = `https://comhairle.bloomproject.us/api${path}`;
		const res = await fetch(apiUrl);
		if (!res.ok) {
			const body = await res.text();
			throw new Error(`${path} → ${res.status}: ${body.slice(0, 200)}`);
		}
		return res.json();
	}

	try {

		const workflows = await fetchApi<WorkflowDto[]>(
			`/conversation/${conversationId}/workflow`
		);

		let workflow = workflows[0];

		demographics = await fetchApi<WorkflowDto[]>(
			`/conversation/${conversationId}/workflow/${workflow.id}/participation_report`
		);

	} catch (e) {
		console.warn('[Report] Failed to fetch demographics:', e.message);
	}

	return { demographics, region };

};
