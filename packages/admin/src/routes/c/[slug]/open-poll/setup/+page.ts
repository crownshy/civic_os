import { getEngagementStats } from '$lib/utils/report';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	// aux + reportData come from open-poll/+layout.ts, shared with Insights.
	const { reportData, aux } = await parent();

	const stats = reportData
		? getEngagementStats(reportData)
		: { totalParticipants: 0, totalStatements: 0, totalVotes: 0 };

	return {
		participants: stats.totalParticipants,
		// aux is the local mirror of every Polis statement, so it counts rows the
		// report omits (rejected, not yet synced into the report export).
		statements: aux.length || stats.totalStatements,
		votes: stats.totalVotes,
		statsAvailable: reportData != null
	};
};
