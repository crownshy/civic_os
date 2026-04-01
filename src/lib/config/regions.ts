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
		]
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
		]
	},

	oregon: {
		slug: 'oregon',
		stateName: 'Oregon',
		demonym: 'Oregonians',
		question:
			'How can Oregonians ensure the benefits of AI are widely shared and risks are responsibly managed?',
		polisId: '5v4ictwb87',
		conversationId: '8a55fb75-5442-4654-886c-339c693b8ac5',
		inviteId: '9e5e3e93-2a71-4979-bcf4-3c894804fe7f',
		hostName: 'Oregon Civic Forum',
		hostUrl: '',
		zipPrefixes: ['97'],
		slides: [
			'This conversation is about how Oregonians can direct the growing impact of artificial intelligence to benefit our communities.',
			'You\u2019ll see statements from your neighbors and other community members about this question. You can vote: agree, disagree, or unsure on each one.',
			'This \u201COpen Poll\u201D will reveal shared concerns and values that will be the basis of action-oriented community conversations in the coming months.'
		],
		hostMessage: [
			'This space is hosted by Oregon Civic Forum. We came together to help citizens come together across political differences to identify issues of local concern, consider possible solutions, and take the necessary steps to achieve meaningful, measurable change.',
			'We invite all Oregonians to share what matters most to them about the future of AI and its impact on communities across the state.'
		]
	}
};

/** Fallback region for unknown subdomains or non-matching zipcodes */
export const GENERIC_REGION: RegionConfig = {
	slug: 'generic',
	stateName: '',
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
	]
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
