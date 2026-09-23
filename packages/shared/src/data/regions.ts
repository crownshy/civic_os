/**
 * Region configuration for multi-state deployment.
 *
 * Each region is the default layer behind a Campaign (picked by the Campaign,
 * not the hostname, since ADR 0011) and carries its own Polis conversation ID,
 * captions, host info, etc.
 *
 * Zipcode lookup determines which region-specific Polis a user joins:
 *   - Utah zip (84xxx) → utah polis
 *   - Oregon zip (97xxx) → oregon polis
 *   - Anything else → generic polis
 */

// Pure region data, no SvelteKit env coupling.

/** A coalition partner / host organization shown on the landing page. */
export interface Partner {
	name: string;
	url: string;
	/** Optional logo URL. When set, the landing page renders the logo; when absent, falls back to a linked name. */
	logo?: string;
}

/** A FAQ entry shown on the landing page accordion. */
export interface FaqEntry {
	question: string;
	answer: string;
}

export interface RegionConfig {
	/** Map key, and the Campaign slug a legacy region still resolves under */
	slug: string;
	/** Full state name */
	stateName: string;
	/** Demonym for captions ("Utahns", "Oregonians") */
	demonym: string;
	/** The main deliberation question, with demonym baked in */
	question: string;
	/** Polis conversation ID for this region */
	polis_workflow_step_id: string;
	polisId: string;
	/** Bloom backend conversation ID (for user registration/tracking) */
	conversationId: string;
	/** Host organization name (lead org in the coalition) */
	hostName: string;
	/** Host organization URL */
	hostUrl: string;
	/** Zipcode prefix(es) that belong to this region */
	zipPrefixes: string[];
	/** Landing page hero h1 ("AI & Our Communities") */
	heroHeader: string;
	/** Paragraphs for the landing page "Context" section. HTML allowed. */
	contextParagraphs: string[];
	/** All coalition orgs (host + partners) for this region. Rendered as a text list today; logo carousel later. */
	partners: Partner[];
	/** Appears on `/campaigns/ai` */
	campaignPageDescription: string;
	/** Appears on `/campaigns/ai` */
	campaignPageHosts: string;
	/** ending Content */
	whatsNext: string;
	/** Per-region FAQ. Seeded with DEFAULT_FAQ placeholders; host orgs author their own. */
	faq: FaqEntry[];
	/** Date labels for the three campaign phases */
	phaseLabels?: { phase1: string; phase2: string; phase3: string };
}

/**
 * Seed FAQ entries — same across all regions until host orgs author their own.
 * Wrap question/answer in [PLACEHOLDER] so reviewers can tell at a glance these aren't real.
 */
const DEFAULT_FAQ: FaqEntry[] = [
	{
		question: 'Who can participate in this poll?',
		answer:
			'Anyone who lives in the region can vote on statements and contribute their own thoughts. There are no qualifications beyond residency.'
	},
	{
		question: 'Are my responses anonymous?',
		answer:
			'Yes. Your votes and any statements you submit are anonymous. If you share an email, that is kept separate from your contributions.'
	},
	{
		question: 'What happens to the results?',
		answer:
			'Results are published publicly when the conversation closes, and feed into live conversations and the Solutions Forum later in the campaign.'
	},
	{
		question: 'How long does this take?',
		answer:
			'Most people spend 3–5 minutes. You can come back anytime to add more votes or new statements.'
	}
];

// ---------------------------------------------------------------------------
// Region definitions
// ---------------------------------------------------------------------------

/** The legacy regions. Every other Campaign is a stored Conversation. */
export const REGIONS: Record<string, RegionConfig> = {
	testing: {
		slug: 'testing',
		stateName: 'Testing',
		demonym: 'Test Subjects',
		question:
			'How can we all ensure the benefits of AI are widely shared and risks are responsibly managed?',
		polisId: '2cd5jmhdvm',
		conversationId: 'e00cfd87-5f22-4332-83bc-bc8401802e3d',
		hostName: 'Bloom Testing',
		hostUrl: 'https://bloomproject.us',
		zipPrefixes: [],
		heroHeader: 'AI and the Future of Our Communities',
		contextParagraphs: [
			'This is a testing environment for the landing page redesign \u2014 placeholder copy.',
			'Use this region to validate UI changes without affecting any real conversation.'
		],
		partners: [{ name: 'Bloom Testing', url: 'https://bloomproject.us' }],
		campaignPageDescription: '',
		campaignPageHosts: '',
		whatsNext: 'Nothing',
		polis_workflow_step_id: '68425b0d-21e9-4f36-8c13-229dab4508bc',
		faq: DEFAULT_FAQ
	},
	utah: {
		slug: 'utah',
		stateName: 'Utah',
		demonym: 'Utahns',
		question:
			'How can Utahns ensure the benefits of AI are widely shared and risks are responsibly managed?',
		polisId: '2y2akzkmbb',
		conversationId: '0a580270-f46b-4b8c-b97a-9a28def51336',
		hostName: 'Utah Common Ground',
		hostUrl: 'https://www.utahcommonground.org/home',
		zipPrefixes: ['84'],
		heroHeader: 'AI and the Future of Our Communities',
		contextParagraphs: [
			'AI is reshaping work, school, government services, and daily life across Utah \u2014 and Utahns have a choice in how we respond. This is a place for us to weigh in.'
		],
		partners: [
			{ name: 'Utah Common Ground', url: 'https://www.utahcommonground.org/home' },
			{ name: 'AEGIX Institute', url: 'https://www.aegixinstitute.org/' },
			{ name: 'Braver Angels', url: 'https://braverangels.org/' },
			{ name: 'Center for Anticipatory Intelligence', url: 'https://www.usu.edu/cai/' },
			{ name: 'Engage Forum', url: 'https://www.engageforum.org/' },
			{
				name: 'Mormon Women for Ethical Government',
				url: 'https://www.mormonwomenforethicalgovernment.org/'
			}
		],
		campaignPageDescription:
			'This Assembly is about making sure Utahns have a real say in how artificial intelligence shapes our lives —ensuring that all Utahns can benefit from new technologies while mitigating risks to families, schools, and communities.',
		campaignPageHosts:
			'Hosted by Utah Common Ground, a project led by a coalition of organizations, including <a href="https://www.aegixinstitute.org/">AEGIX</a>, <a href="https://braverangels.org/">Braver Angels</a>, <a href="https://www.usu.edu/cai/">Center for Anticipatory Intelligence</a>, <a href="https://www.engageforum.org/">Engage Forum</a>, and <a href="https://www.mormonwomenforethicalgovernment.org/">Mormon Women for Ethical Government</a>.',
		whatsNext:
			'<a href="https://www.utahcommonground.org/get-involved">Sign up↗</a> for live conversations about this topic, taking place both online and in-person across Salt Lake, Utah, and Cache counties. These conversations will be an opportunity to connect with your neighbors and develop shared values around AI\'s influence on the people we care about.',

		polis_workflow_step_id: '9d1041f9-fda6-4597-b4b0-c1260e4b7268',
		faq: DEFAULT_FAQ,
		phaseLabels: { phase1: 'APRIL 2026', phase2: 'MAY 2026', phase3: 'SEPTEMBER 2026' }
	},
	oregon: {
		slug: 'oregon',
		stateName: 'Central Oregon',
		demonym: 'Central Oregonians',
		question:
			'How can Central Oregonians ensure benefits of AI are widely shared and risks are responsibly managed?',
		polisId: '5v4ictwb87',
		conversationId: '8a55fb75-5442-4654-886c-339c693b8ac5',
		hostName: 'Central Oregon Civic Action Project',
		hostUrl: 'https://cocap.us/',
		zipPrefixes: ['97'],
		heroHeader: 'AI & Our Communities',
		contextParagraphs: [
			'AI is reshaping Central Oregon — and we have a choice in how we respond. This is a place for us to weigh in.',
			'The 2026 Community Solutions Assembly on AI asks how Central Oregon can ensure the benefits of AI are widely shared and its risks responsibly managed in our communities. It starts with an Open Poll you can access today; this only takes a few minutes and it shapes everything that follows.'
		],
		partners: [
			{ name: 'Central Oregon Civic Action Project', url: 'https://cocap.us/' },
			{ name: 'Central Oregon Intergovernmental Council', url: 'https://www.coic.org/' },
			{ name: 'Central Oregon Community College', url: 'https://cocc.edu/' },
			{ name: 'Citizens4Community', url: 'https://citizens4community.com/' }
		],
		campaignPageDescription:
			'This Assembly is about making sure Central Oregonians have a real say in how artificial intelligence shapes our lives — who it benefits, who gets left behind, and what we can do about it at every level, from families and schools to city and state policy.',
		campaignPageHosts: '',
		whatsNext:
			'<a href="/conversations?utm_source=whatsNext">Join us</a> in May and June for small group conversations taking place in Deschutes, Jefferson, and Crook counties — both in-person and online. They\'ll build on the themes and common ground that emerge from this poll. Share your email above to stay in the loop, or visit <a href="https://cocap.us" target="_blank">cocap.us</a> to learn more.',
		polis_workflow_step_id: '8299fec7-a543-419f-8692-f68652648a0b',
		faq: DEFAULT_FAQ,
		phaseLabels: { phase1: 'APRIL 2026', phase2: 'MAY 2026', phase3: 'SEPTEMBER 2026' }
	}
};

/** Fallback region for Campaigns no region claims, and for non-matching zipcodes */
export const GENERIC_REGION: RegionConfig = {
	slug: 'all',
	stateName: 'USA',
	demonym: 'Americans',
	question:
		'How can Americans ensure the benefits of AI are widely shared and its risks are responsibly managed?',
	polisId: '58wekdkx9u',
	conversationId: '30f5c285-a538-4ed7-9565-61f8e4b9d998',
	hostName: 'Bloom Project',
	hostUrl: 'https://bloom-project.org/',
	zipPrefixes: [],
	heroHeader: 'AI and the Future of Our Communities',
	contextParagraphs: [
		"People across America are weighing in on how AI is changing our country — and what we should do about it. Now it's your turn.",
		'Your responses, combined with everyone else\u2019s, will help surface what Americans have in common, where we differ, and what we might tackle together. Results will be published publicly so anyone can see where people stand.'
	],
	partners: [{ name: 'The Bloom Project', url: 'https://www.bloom-project.org/' }],
	campaignPageDescription: '',
	campaignPageHosts: '',
	whatsNext:
		'When this conversation closes, Bloom will publish the results publicly — showing where Americans agree, where we differ, and what the opinion landscape looks like across different groups. We’ll share a link when it’s ready.',
	polis_workflow_step_id: 'f553a7b9-b3ac-4159-b88d-198f609b110c',
	faq: DEFAULT_FAQ
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function formatDurationLabel(hours: number, minutes: number) {
	const hoursQualifier = hours > 1 ? 'hours' : 'hour';
	return `${hours} ${hoursQualifier}${minutes > 0 ? `${minutes} mins` : ''}`;
}

/**
 * Given a zipcode, determine which region-specific Polis the user should join.
 * Returns the matching region, or GENERIC_REGION if no prefix matches.
 *
 * Only meaningful for the legacy regions, where a region IS the Campaign. A
 * stored Campaign is named by its URL, so its participants are not routed by
 * zip. See `Campaign.isLegacyRegion`.
 */
export function getRegionByZipcode(zip: string): RegionConfig {
	const trimmed = zip.trim();
	for (const region of Object.values(REGIONS)) {
		for (const prefix of region.zipPrefixes) {
			if (trimmed.startsWith(prefix)) {
				return region;
			}
		}
	}
	return GENERIC_REGION;
}

/**
 * The first label of a hostname, when it has one to spare: `utah` for both
 * `utah.bloomproject.us` and `utah.localhost`, empty for an apex.
 *
 * Nothing resolves a Campaign or a Place from this any more (ADR 0011). It is
 * kept for one redirect: the root of the legacy region hosts production still
 * serves (`utah.`, `oregon.`, `testing.`, `all.`) opens that region's Campaign.
 */
export function extractSubdomain(hostname: string): string {
	// Strip port if present
	const host = hostname.split(':')[0];

	// Local dev: utah.localhost → "utah"
	if (host.endsWith('.localhost') || host.endsWith('.local')) {
		const parts = host.split('.');
		if (parts.length >= 2) {
			return parts[0];
		}
		return '';
	}

	// Production: utah.bloomproject.us → "utah"
	const parts = host.split('.');
	if (parts.length >= 3) {
		return parts[0];
	}

	return '';
}
