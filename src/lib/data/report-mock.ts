import type { WikiPollReport } from '$lib/types/report';

export const mockReport: WikiPollReport = {
	comments: [
		{
			tid: 1,
			text: 'Companies that use AI to automate jobs should also help fund training for the workers they displace.',
			overall_votes: { agrees: 1504, disagrees: 215, passes: 95 },
			group_votes: [
				{ group_id: 0, agrees: 520, disagrees: 42, passes: 28 },
				{ group_id: 1, agrees: 498, disagrees: 85, passes: 37 },
				{ group_id: 2, agrees: 486, disagrees: 88, passes: 30 }
			],
			group_informed_consensus: 0.83,
			divisiveness: 0.12
		},
		{
			tid: 2,
			text: 'Local governments should have the authority to regulate how AI is used within their jurisdictions.',
			overall_votes: { agrees: 1312, disagrees: 398, passes: 104 },
			group_votes: [
				{ group_id: 0, agrees: 480, disagrees: 78, passes: 32 },
				{ group_id: 1, agrees: 410, disagrees: 165, passes: 45 },
				{ group_id: 2, agrees: 422, disagrees: 155, passes: 27 }
			],
			group_informed_consensus: 0.72,
			divisiveness: 0.31
		},
		{
			tid: 3,
			text: 'AI tools used in public services like policing or welfare should be fully transparent and auditable.',
			overall_votes: { agrees: 1589, disagrees: 156, passes: 69 },
			group_votes: [
				{ group_id: 0, agrees: 548, disagrees: 28, passes: 14 },
				{ group_id: 1, agrees: 520, disagrees: 62, passes: 38 },
				{ group_id: 2, agrees: 521, disagrees: 66, passes: 17 }
			],
			group_informed_consensus: 0.88,
			divisiveness: 0.08
		},
		{
			tid: 4,
			text: 'Schools should teach AI literacy starting in elementary school so kids grow up understanding how these systems work.',
			overall_votes: { agrees: 1423, disagrees: 287, passes: 104 },
			group_votes: [
				{ group_id: 0, agrees: 510, disagrees: 52, passes: 28 },
				{ group_id: 1, agrees: 445, disagrees: 128, passes: 47 },
				{ group_id: 2, agrees: 468, disagrees: 107, passes: 29 }
			],
			group_informed_consensus: 0.78,
			divisiveness: 0.22
		},
		{
			tid: 5,
			text: 'There should be a public registry of all AI systems being used by government agencies.',
			overall_votes: { agrees: 1478, disagrees: 198, passes: 138 },
			group_votes: [
				{ group_id: 0, agrees: 530, disagrees: 38, passes: 22 },
				{ group_id: 1, agrees: 472, disagrees: 88, passes: 60 },
				{ group_id: 2, agrees: 476, disagrees: 72, passes: 56 }
			],
			group_informed_consensus: 0.81,
			divisiveness: 0.14
		},
		{
			tid: 6,
			text: 'AI-generated content should always be clearly labeled so people know when they are interacting with AI.',
			overall_votes: { agrees: 1556, disagrees: 178, passes: 80 },
			group_votes: [
				{ group_id: 0, agrees: 545, disagrees: 30, passes: 15 },
				{ group_id: 1, agrees: 505, disagrees: 72, passes: 43 },
				{ group_id: 2, agrees: 506, disagrees: 76, passes: 22 }
			],
			group_informed_consensus: 0.86,
			divisiveness: 0.1
		},
		{
			tid: 7,
			text: 'The government should not restrict private companies from developing AI however they see fit.',
			overall_votes: { agrees: 612, disagrees: 987, passes: 215 },
			group_votes: [
				{ group_id: 0, agrees: 98, disagrees: 420, passes: 72 },
				{ group_id: 1, agrees: 312, disagrees: 248, passes: 60 },
				{ group_id: 2, agrees: 202, disagrees: 319, passes: 83 }
			],
			group_informed_consensus: 0.34,
			divisiveness: 0.72
		},
		{
			tid: 8,
			text: 'Healthcare decisions should never be made solely by AI without a human doctor involved.',
			overall_votes: { agrees: 1602, disagrees: 142, passes: 70 },
			group_votes: [
				{ group_id: 0, agrees: 555, disagrees: 22, passes: 13 },
				{ group_id: 1, agrees: 525, disagrees: 58, passes: 37 },
				{ group_id: 2, agrees: 522, disagrees: 62, passes: 20 }
			],
			group_informed_consensus: 0.89,
			divisiveness: 0.06
		},
		{
			tid: 9,
			text: 'Communities should have a say in whether AI surveillance tools are deployed in their neighborhoods.',
			overall_votes: { agrees: 1534, disagrees: 176, passes: 104 },
			group_votes: [
				{ group_id: 0, agrees: 538, disagrees: 32, passes: 20 },
				{ group_id: 1, agrees: 498, disagrees: 72, passes: 50 },
				{ group_id: 2, agrees: 498, disagrees: 72, passes: 34 }
			],
			group_informed_consensus: 0.85,
			divisiveness: 0.11
		},
		{
			tid: 10,
			text: 'AI companies should be required to pay into a public fund that supports communities affected by automation.',
			overall_votes: { agrees: 1289, disagrees: 412, passes: 113 },
			group_votes: [
				{ group_id: 0, agrees: 488, disagrees: 72, passes: 30 },
				{ group_id: 1, agrees: 385, disagrees: 188, passes: 47 },
				{ group_id: 2, agrees: 416, disagrees: 152, passes: 36 }
			],
			group_informed_consensus: 0.71,
			divisiveness: 0.35
		},
		{
			tid: 11,
			text: 'Small businesses should receive government support to adopt AI tools so they can compete with large corporations.',
			overall_votes: { agrees: 1367, disagrees: 298, passes: 149 },
			group_votes: [
				{ group_id: 0, agrees: 492, disagrees: 62, passes: 36 },
				{ group_id: 1, agrees: 432, disagrees: 128, passes: 60 },
				{ group_id: 2, agrees: 443, disagrees: 108, passes: 53 }
			],
			group_informed_consensus: 0.75,
			divisiveness: 0.25
		},
		{
			tid: 12,
			text: 'People should have the right to know if an AI was used to make a decision that affects them.',
			overall_votes: { agrees: 1622, disagrees: 128, passes: 64 },
			group_votes: [
				{ group_id: 0, agrees: 560, disagrees: 18, passes: 12 },
				{ group_id: 1, agrees: 532, disagrees: 52, passes: 36 },
				{ group_id: 2, agrees: 530, disagrees: 58, passes: 16 }
			],
			group_informed_consensus: 0.91,
			divisiveness: 0.05
		}
	],
	groups: [
		{
			group_id: 0,
			representative_comments: [
				{ tid: 3, text: 'AI tools used in public services like policing or welfare should be fully transparent and auditable.' },
				{ tid: 8, text: 'Healthcare decisions should never be made solely by AI without a human doctor involved.' },
				{ tid: 12, text: 'People should have the right to know if an AI was used to make a decision that affects them.' }
			],
			members: Array.from({ length: 590 }, (_, i) => i)
		},
		{
			group_id: 1,
			representative_comments: [
				{ tid: 7, text: 'The government should not restrict private companies from developing AI however they see fit.' },
				{ tid: 11, text: 'Small businesses should receive government support to adopt AI tools so they can compete with large corporations.' },
				{ tid: 2, text: 'Local governments should have the authority to regulate how AI is used within their jurisdictions.' }
			],
			members: Array.from({ length: 620 }, (_, i) => i + 590)
		},
		{
			group_id: 2,
			representative_comments: [
				{ tid: 1, text: 'Companies that use AI to automate jobs should also help fund training for the workers they displace.' },
				{ tid: 9, text: 'Communities should have a say in whether AI surveillance tools are deployed in their neighborhoods.' },
				{ tid: 5, text: 'There should be a public registry of all AI systems being used by government agencies.' }
			],
			members: Array.from({ length: 604 }, (_, i) => i + 1210)
		}
	],
	participants: Array.from({ length: 1814 }, (_, i) => ({
		pid: i,
		group_id: i < 590 ? 0 : i < 1210 ? 1 : 2,
		pca_position: {
			x: (Math.random() - 0.5) * 4,
			y: (Math.random() - 0.5) * 4
		}
	}))
};

export const reportConfig = {
	title: 'AI and the Future of Our Communities',
	region: 'UTAH',
	phase: 'PHASE 1: IDEAS REPORT',
	description:
	'This is what this poll is about. Write a few sentence to describe what this topic is about, why is it important. Maybe in a very high-level, summarise how it went. ',
	participantCount: 2145,
	statementCount: 132,
	totalVotes: 1523,
	groupLabels: ['Group A', 'Group B', 'Group C'] as const
};
