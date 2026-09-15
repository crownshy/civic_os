import type { ReportConfig } from '../domain/types';

/** Central Oregon's own copy, links and map region. */
export const REPORT_CONFIG: ReportConfig = {
	siteTitle: 'Public Report on AI & Central Oregon',
	brand: 'AI & Central Oregon',
	learnMore: { href: 'https://cocap.us/ai', label: 'Learn more at COCAP.US' },
	map: {
		homeCounties: {
			'41017': 'Deschutes',
			'41013': 'Crook',
			'41031': 'Jefferson'
		}
	},
	pages: {
		title: {
			heading: ['What did Central Oregonians have to say about ', { highlight: 'AI?' }],
			body: [
				'Central Oregon Civic Action Project and its partners talked to ',
				{ highlight: 'over 400 residents' },
				' from around the region to hear what they thought should be done about AI.'
			],
			image: { width: 1800, height: 849 }
		},
		demogs: {
			stat: '400+',
			body: 'People across the region participated in this conversation, both through our Open Poll and live conversations.'
		},
		groups: {
			heading: 'Participants represented a range of perspectives on AI…',
			body: "We found three opinion groups based on our analysis of people's voting patterns. Click each group to learn about what distinguished them from the rest."
		},
		consensus: {
			heading: '…but we found a lot of common ground.',
			body: 'Despite their differences, almost everyone agreed on the importance of transparency and community involvement in AI-related decision-making.'
		},
		cta: {
			heading: 'Now is the time to act for the future of our communities.',
			body: [
				"We're organizing a Civic Assembly in December 2026, where 30-40 residents will develop policies to make sure the public has a meaningful role in the government's AI-related decisions. ",
				{ highlight: 'You are invited to participate;' },
				' selected delegates will receive a $250 stipend.'
			],
			signupUrl: 'https://bloomproject.typeform.com/to/C1N3LI7g?utm_source=report',
			signupLabel: 'Register here'
		},
		themes: {
			heading: 'What 400+ people had to say about AI in Central Oregon',
			body: 'Responses gathered in six listening sessions around the region and one open poll, sorted into seven themes. Each square below is one poll statement or one comment from a live session.'
		}
	}
};
