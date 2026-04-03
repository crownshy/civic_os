/**
 * Region configuration for multi-state deployment.
 *
 * Each region maps to a subdomain (utah.bloomproject.us, oregon.bloomproject.us)
 * and carries its own Polis conversation ID, captions, host info, etc.
 *
 * Zipcode lookup determines which region-specific Polis a user joins:
 *   - Utah zip (84xxx) → utah polis
 *   - Oregon zip (97xxx) → oregon polis
 *   - Anything else → generic polis
 */

export interface RegionConfig {
	/** Slug used in subdomain and as map key */
	slug: string;
	/** Full state name */
	stateName: string;
	/** Demonym for captions ("Utahns", "Oregonians") */
	demonym: string;
	/** The main deliberation question, with demonym baked in */
	question: string;
	/** Polis conversation ID for this region */
	polisId: string;
	/** Bloom backend conversation ID (for user registration/tracking) */
	conversationId: string;
	/** Bloom backend invite ID (for user registration/tracking) */
	inviteId: string;
	/** Host organization name */
	hostName: string;
	/** Host organization URL */
	hostUrl: string;
	/** Zipcode prefix(es) that belong to this region */
	zipPrefixes: string[];
	/** Landing page carousel slides */
	slides: string[];
	/** Host message paragraphs (for the "A Message from Your Hosts" dialog) */
	hostMessage: string[];
	/** Appears in the aboutConversation dialog */
	aboutConversation: string[];
	/** ending Content */
	whatsNext: string;
	goDeeper: string;

}

// ---------------------------------------------------------------------------
// Region definitions
// ---------------------------------------------------------------------------

export const REGIONS: Record<string, RegionConfig> = {
	testing: {
		slug: 'testing',
		stateName: 'Testing',
		demonym: 'Test Subjects',
		question:
			'How can we all ensure the benefits of AI are widely shared and risks are responsibly managed?',
		polisId: '2cd5jmhdvm',
		conversationId: 'e00cfd87-5f22-4332-83bc-bc8401802e3d',
		inviteId: 'b3778c56-32fa-4c8a-973f-7723b066daca',
		hostName: 'Bloom Testing',
		hostUrl: 'https://bloomproject.us',
		zipPrefixes: [],
		slides: [
			'This conversation is about how everyone can direct the growing impact of artificial intelligence to benefit our communities.',
			'You\u2019ll see statements from your neighbors and other community members about this question. You can vote: agree, disagree, or unsure on each one.',
			'This \u201COpen Poll\u201D will reveal shared concerns and values that will be the basis of action-oriented community conversations in the coming months.'
		],
		hostMessage: [
			'This is a testing version of the site to check things are working and to play with new features with play',
			'This is mostly just to see if things work',
			'This is not a live conversation'
		],
		aboutConversation: [
			'This conversation is about how Utah can prepare for the growing impact of AI in so many aspects of our lives (work and the economy, education, wellbeing, information quality, government services, etc).',
			'It is hosted by Utah Common Ground, a collaboration of diverse nonpartisan organizations across Utah. You can find out more about them at utahcommonground.org.'
		],
		whatsNext: "Nothing",
		goDeeper: "Nothing"
	},
	utah: {
		slug: 'utah',
		stateName: 'Utah',
		demonym: 'Utahns',
		question:
			'How can Utahns ensure the benefits of AI are widely shared and risks are responsibly managed?',
		polisId: '2y2akzkmbb',
		conversationId: '0a580270-f46b-4b8c-b97a-9a28def51336',
		inviteId: '9df618c4-5060-4215-b0e1-118a78dfdb96',
		hostName: 'Utah Common Ground',
		hostUrl: 'https://www.utahcommonground.org/home',
		zipPrefixes: ['84'],
		slides: [
			'This conversation is about how Utahns can direct the growing impact of artificial intelligence to benefit our communities.',
			'You\u2019ll see statements from your neighbors and other community members about this question. You can vote: agree, disagree, or unsure on each one.',
			'This \u201COpen Poll\u201D will reveal shared concerns and values that will be the basis of action-oriented community conversations in the coming months.'
		],
		hostMessage: [
			'This space is hosted by <a href="https://www.utahcommonground.org/home" class="text-destructive underline" target="_blank" rel="noopener noreferrer">Utah Common Ground</a>, a coalition of nonprofit organizations from around the state, including Utah State University Center for Anticipatory Intelligence, the AI Ethics and Governance Institute, Engage Utah, and Mormon Women for Ethical Governance. We came together to help citizens come together across political differences to identify issues of local concern, consider possible solutions, and take the necessary steps to achieve meaningful, measurable change.',
			'We invite all Utahns to share what matters most to them about the future of AI and its impact on communities across the state. Over several weeks, this process will surface concerns, tensions, and opportunities for deeper discussion, as well as areas where additional information could help promote understanding.',
			'After this period of broad public input, a representative group of approximately 30 to 50 residents from three counties (Cache, Salt Lake, and Utah Counties) will be invited to convene in person in August and September 2026 for a Solutions Forum. Participants will reflect the demographic, geographic, and political diversity of Utah and will receive stipends to ensure participation is accessible.'
		],
		aboutConversation: [
			'This conversation is just for testing'
		],
		whatsNext: "In April and May, there will be <strong>live conversations</strong> across Salt Lake, Weber, and Cache Counties. These conversations will build on the common themes and shared values that emerge from the statements here. If you want to take part in these or future conversations, please <strong>share your email above</strong> or visit the <Link href=\"https://www.utahcommonground.org/home\" external class=\"font-bold\">Utah Common Ground website.</Link>",
		goDeeper: "The ultimate goal of this campaign is to surface common ground that lets Utahns take action from the local to state levels and beyond. If you are interested in getting involved in a deeper way, let us know at <Link href=\"mailto:hello@bloom-project.org\" external class=\"font-bold\">hello@bloom-project.org</Link>."
	},

	oregon: {
		slug: 'oregon',
		stateName: 'Oregon',
		demonym: 'Central Oregonians',
		question:
			'How can Central Oregonians ensure benefits of AI are widely shared and risks are responsibly managed?',
		polisId: '5v4ictwb87',
		conversationId: '8a55fb75-5442-4654-886c-339c693b8ac5',
		inviteId: '9e5e3e93-2a71-4979-bcf4-3c894804fe7f',
		hostName: 'Central Oregon Civic Action Project',
		hostUrl: 'https://cocap.us/',
		zipPrefixes: ['97'],
		slides: [
			'Your neighbors and fellow Central Oregonians are weighing in on how AI is changing our region — and what we should do about it. Now it\u2019s your turn.',
			'You\u2019ll see statements from community members about this question. For each one, you can share if you: 𝗮𝗴𝗿𝗲𝗲, 𝗱𝗶𝘀𝗮𝗴𝗿𝗲𝗲, or are 𝘂𝗻𝘀𝘂𝗿𝗲.',
			'Your responses — combined with everyone else\u2019s — will help surface what Central Oregonians have in common, where we differ, and what we might tackle together.',
			'This poll is just the beginning. Live conversations and a community Solutions Assembly follow in the months ahead.'
		],
		hostMessage: [
			`
		  <p>YOUR HOSTS:</p>
		  <ul class='list-disc list-inside'>
			<li>
			  Central Oregon Civic Action Project 	  
			</li>
			<li>
			  Citizens for Community 
			</li>
			<li>
			  Central Oregon Intergovernmental Council
			</li>
			<li>
			  Central Oregon Community College
			</li>
		  </ul>
		  `,
			'First, thank you for being here and for caring about the future of our region.',
			'AI is already reshaping Central Oregon — bringing real promise alongside real concerns. Many see new economic opportunities, better tools for innovation, and new ways to tackle longstanding challenges. Others worry about jobs, education, mental health, water and natural resources, and access to trustworthy information. Both are true, and both matter.',
			'Central Oregonians should have a say in changes that shape their lives. This poll is a first step — a way to understand where our community stands, find common ground, and build toward solutions together.',
			'Central Oregon Civic Action Project believes people should have a say in the changes that shape their lives. This Open Poll is a first step — a way to understand where our community stands, find common ground, and build toward solutions together.',
			'This conversation is open to all Central Oregon residents, regardless of background or belief. It only takes a few minutes. We hope you\u2019ll add your voice — and pass it on.',
			`Questions? Reach Josh at <a href="mailto:josh@cocap.us">josh@cocap.us</a>.`
		],
		aboutConversation: [
			"This Open Poll is hosted by the <a href='http://cocap.us'>Central Oregon Civic Action Project</a> — a coalition of community organizations from across the region.",
			"Central Oregon is navigating big questions about AI and how it's shaping our communities. This is a space for residents to share what matters most — what you're hopeful about, what concerns you, and what you think our region needs.",
			"There are no right answers here. This poll is a first step toward understanding where Central Oregonians stand, finding common ground, and building toward solutions together.",
			"<span class='text-bold'>OPEN POLL (now) → LIVE CONVERSATIONS (May/June) → SOLUTIONS FORUM (Fall)</span>",
			"<span class='text-bold >Step 1: This Poll</span>",
			"Share your views now. Your responses help surface what we agree on, where we differ, and what questions deserve deeper conversation.",
			"<span class='text-bold'>Step 2: Live Conversations (May/June)</span>",
			"Small group discussions — in person and online — open to anyone in the region. A chance to hear from neighbors, think out loud, and go deeper than a poll allows.",
			"<span class='text-bold'>Solutions Forum (Fall 2026)</span>",
			"A representative group of 30–50 residents will come together to deliberate on what this process surfaced — and work toward recommendations with broad, cross-party support.",
			"Questions or want to get involved? Reach us at <a href='mailto:hello@cocap.us'>hello@cocap.us</a>."
		],
		whatsNext: "In May and June, small group conversations will take place in Deschutes, Jefferson, and Crook counties — and online. They'll build on the themes and common ground that emerge from this poll. Share your email above to stay in the loop and be notified when registration opens, or visit [cocap.us] to learn more.",
		goDeeper: "This process is ultimately about finding common ground and turning it into action that benefits Central Oregon communities. If you'd like to get more involved, reach out at <a href=\"hello@cocap.us\">hello@cocap.us</a>."
	}
};

/** Fallback region for unknown subdomains or non-matching zipcodes */
export const GENERIC_REGION: RegionConfig = {
	slug: 'generic',
	stateName: 'USA',
	demonym: 'Americans',
	question:
		'How can we ensure the benefits of AI are widely shared and risks are responsibly managed?',
	polisId: '58wekdkx9u',
	conversationId: '30f5c285-a538-4ed7-9565-61f8e4b9d998',
	inviteId: '0571cc17-64ad-4949-9034-76c74be254ce',
	hostName: 'Bloom Project',
	hostUrl: 'https://www.bloom-project.org/',
	zipPrefixes: [],
	slides: [
		'This conversation is about how we can direct the growing impact of artificial intelligence to benefit our communities.',
		'You\u2019ll see statements from your neighbors and other community members about this question. You can vote: agree, disagree, or unsure on each one.',
		'This \u201COpen Poll\u201D will reveal shared concerns and values that will be the basis of action-oriented community conversations in the coming months.'
	],
	hostMessage: [
		'This space is hosted by <a href="https://www.bloom-project.org/" class="text-destructive underline" target="_blank" rel="noopener noreferrer">Bloom Project</a>. We came together to help citizens come together across political differences to identify issues of local concern, consider possible solutions, and take the necessary steps to achieve meaningful, measurable change.'
	],
	aboutConversation: [],
	whatsNext: "",
	goDeeper: ""
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Resolve a subdomain string (e.g. "utah", "oregon") to a region config. */
export function getRegionBySubdomain(subdomain: string): RegionConfig {
	const key = subdomain.toLowerCase();
	return REGIONS[key] ?? GENERIC_REGION;
}

/**
 * Given a zipcode, determine which region-specific Polis the user should join.
 * Returns the matching region, or GENERIC_REGION if no prefix matches.
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
 * Extract subdomain from a hostname.
 * Handles production (utah.bloomproject.us) and local dev (utah.localhost).
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
