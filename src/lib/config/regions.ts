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
	polis_workflow_step_id: string;
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
	/** Landing page carousel pre-header */
	carouselPreHeader: string;
	/** Landing page carousel header */
	carouselHeader: string;
	/** Landing page carousel slides */
	slides: string[];
	/** Host message paragraphs (for the "A Message from Your Hosts" dialog) */
	hostMessage: string[];
	/** Appears in the aboutConversation dialog */
	aboutConversation: string[];
	/** ending Content */
	whatsNext: string;
	goDeeper: string;
	fullHosts: string;

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
		carouselPreHeader: 'WHAT SHOULD WE DO ABOUT',
		carouselHeader: 'AI and the Future of Our Communities',
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
		goDeeper: "Nothing",
		polis_workflow_step_id: "68425b0d-21e9-4f36-8c13-229dab4508bc",
		fullHosts: ''
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
		carouselPreHeader: 'WHAT SHOULD WE DO ABOUT',
		carouselHeader: 'AI and the Future of Our Communities',
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
			'This conversation is about how Utah can prepare for the growing impact of AI in so many aspects of our lives (work and the economy, education, wellbeing, information quality, government services, etc).',
			'            It is hosted by Utah Common Ground, a collaboration of diverse nonpartisan organizations across Utah. You can find out more about them at utahcommonground.org.'
		],
		whatsNext: "In April and May, there will be <strong>live conversations</strong> across Salt Lake, Weber, and Cache Counties. These conversations will build on the common themes and shared values that emerge from the statements here. If you want to take part in these or future conversations, please <strong>share your email above</strong> or visit the <Link href=\"https://www.utahcommonground.org/home\" external class=\"font-bold\">Utah Common Ground website.</Link>",
		goDeeper: "The ultimate goal of this campaign is to surface common ground that lets Utahns take action from the local to state levels and beyond. If you are interested in getting involved in a deeper way, let us know at <Link href=\"mailto:hello@bloom-project.org\" external class=\"font-bold\">hello@bloom-project.org</Link>.",

		polis_workflow_step_id: "9d1041f9-fda6-4597-b4b0-c1260e4b7268",
		fullHosts: "<a href='https://www.utahcommonground.org/home'>Utah Common Ground</a>"
	},

	oregon: {
		slug: 'oregon',
		stateName: 'Central Oregon',
		demonym: 'Central Oregonians',
		question:
			'How can Central Oregonians ensure benefits of AI are widely shared and risks are responsibly managed?',
		polisId: '5v4ictwb87',
		conversationId: '8a55fb75-5442-4654-886c-339c693b8ac5',
		inviteId: '9e5e3e93-2a71-4979-bcf4-3c894804fe7f',
		hostName: 'Central Oregon Civic Action Project',
		hostUrl: 'https://cocap.us/',
		zipPrefixes: ['97'],
		carouselPreHeader: 'CENTRAL OREGON SPEAKS:',
		carouselHeader: 'AI and Our Future',
		slides: [
			'AI is reshaping Central Oregon — and we have a choice in how we respond. This is a place for us to weigh in.',
			'You\'ll see statements from community members. For each one, you can respond: agree, disagree, or are unsure.',
			'Your responses — combined with everyone else\'s — will help surface what Central Oregonians have in common, where we differ, and what we might tackle together.',
			'This is the first step. What we discover here leads to live conversations and a community Solutions Assembly.'
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
			"<span class='font-bold'>OPEN POLL (now) → LIVE CONVERSATIONS (May/June) → SOLUTIONS FORUM (Fall)</span>",
			"<span class='font-bold >Step 1: This Poll</span>",
			"Share your views now. Your responses help surface what we agree on, where we differ, and what questions deserve deeper conversation.",
			"<span class='font-bold'>Step 2: Live Conversations (May/June)</span>",
			"Small group discussions — in person and online — open to anyone in the region. A chance to hear from neighbors, think out loud, and go deeper than a poll allows.",
			"<span class='font-bold'>Solutions Forum (Fall 2026)</span>",
			"A representative group of 30–50 residents will come together to deliberate on what this process surfaced — and work toward recommendations with broad, cross-party support.",
			"Questions or want to get involved? Reach us at <a href='mailto:hello@cocap.us'>hello@cocap.us</a>."
		],
		whatsNext: "In May and June, small group conversations will take place in Deschutes, Jefferson, and Crook counties — and online. They'll build on the themes and common ground that emerge from this poll. Share your email above to stay in the loop and be notified when registration opens, or visit [cocap.us] to learn more.",
		goDeeper: "This process is ultimately about finding common ground and turning it into action that benefits Central Oregon communities. If you'd like to get more involved, reach out at <a href=\"hello@cocap.us\">hello@cocap.us</a>.",
		polis_workflow_step_id: "8299fec7-a543-419f-8692-f68652648a0b",
		fullHosts: "<a href='https://www.utahcommonground.org/home'>Central Oregon Civic Action Project</a>, <a href='https://www.coic.org/'>Central Oregon Intergovernmental Council</a>, <a href='https://cocc.edu/'>Central Oregon Community College</a>, and <a href='https://citizens4community.com/'>Citizens4Community</a>."
	}
};

/** Fallback region for unknown subdomains or non-matching zipcodes */
export const GENERIC_REGION: RegionConfig = {
	slug: 'all',
	stateName: 'USA',
	demonym: 'Americans',
	question: 'How can Americans ensure the benefits of AI are widely shared and its risks are responsibly managed?',
	polisId: '58wekdkx9u',
	conversationId: '30f5c285-a538-4ed7-9565-61f8e4b9d998',
	inviteId: '0571cc17-64ad-4949-9034-76c74be254ce',
	hostName: 'Bloom Project',
	hostUrl: 'https://bloom-project.org/',
	zipPrefixes: [],
	carouselPreHeader: 'WHAT SHOULD WE DO ABOUT',
	carouselHeader: 'AI and the Future of Our Communities',
	slides: [
		'People across America are weighing in on how AI is changing our country — and what we should do about it. Now it\'s your turn.',
		'You\u2019ll see statements from community members on this question. For each one, you can share if you: agree, disagree, or are unsure.',
		'Your responses — combined with everyone else\u2019s — will help surface what Americans have in common, where we differ, and what we might tackle together.',
		'Results will be published publicly so anyone can see where people stand.',
	],
	hostMessage: [
		"First, thank you for being here and for caring about the future of our country.",
		"AI is already reshaping American life — bringing real promise alongside real concerns. Many see new economic opportunities, better tools for healthcare and education, and new ways to tackle longstanding challenges. Others worry about jobs, privacy, democracy, and access to truthful information. Both are true, and both matter.",
		"Americans should have a say in changes that shape their lives. This poll is a way to understand where our country stands and to put that picture in front of the public, policymakers, and the companies building these tools.",
		"This conversation is open to all U.S. residents, regardless of background or belief. It only takes a few minutes. We hope you’ll add your voice — and pass it on.",
		"Questions? Reach us at <a href='mailto:hello@bloom-project.org'>hello@bloom-project.org</a>."
	],
	aboutConversation: [
		"This Open Poll is hosted by The Bloom Project, a civic technology initiative that uses deliberative polling to surface where the American public actually stands on complex issues.",
		"America is navigating big questions about AI and how it’s shaping our lives. This is a space for residents to share what matters most — what you’re hopeful about, what concerns you, and what you think our country needs.",
		"There are no right answers here. This poll is designed to reveal where Americans agree, where we differ, and what the genuine fault lines are — in a format that anyone can understand.",
		"Results will be published publicly when the conversation closes.",
		"Questions or want to get involved? Reach us at <a href='mailto:hello@bloom-project.org'>hello@bloom-project.org</a>."
	],
	whatsNext: "When this conversation closes, Bloom will publish the results publicly — showing where Americans agree, where we differ, and what the opinion landscape looks like across different groups. We’ll share a link when it’s ready.",
	goDeeper: "If you’d like to get more involved with Bloom’s civic deliberation work, reach out at <a href='mailto:hello@bloom-project.org'>hello@bloom-project.org</a> or visit <a href='https://www.bloom-project.org'>https://www.bloom-project.org</a>.",
	polis_workflow_step_id: "f553a7b9-b3ac-4159-b88d-198f609b110c",
	fullHosts: "<a href='https://www.bloom-project.org/'>The Bloom Project</a>."
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

/**
 * Build the full URL for a region's subdomain with zipcode parameter.
 * Handles both production and local development environments.
 */
export function getRegionUrl(region: RegionConfig, zipCode: string, currentHostname: string): string {
	const host = currentHostname.split(':')[0];
	const port = currentHostname.includes(':') ? ':' + currentHostname.split(':')[1] : '';

	// Determine base domain
	let baseDomain: string;
	if (host.endsWith('.localhost') || host.endsWith('.local')) {
		// Local dev
		baseDomain = host.endsWith('.localhost') ? 'localhost' : 'local';
	} else {
		// Production - extract base domain from current hostname
		// e.g., utah.bloomproject.us → bloomproject.us
		const parts = host.split('.');
		if (parts.length >= 2) {
			baseDomain = parts.slice(-2).join('.');
		} else {
			baseDomain = 'bloomproject.us'; // fallback
		}
	}

	// Build the full URL
	const protocol = host.includes('localhost') || host.includes('.local') ? 'http' : 'https';
	const subdomain = region.slug;
	const url = `${protocol}://${subdomain}.${baseDomain}${port}`;

	return `${url}/landing?zip_code=${encodeURIComponent(zipCode)}`;
}
