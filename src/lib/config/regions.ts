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
	utah: {
		slug: 'utah',
		stateName: 'Utah',
		demonym: 'Utahns',
		question:
			'How can Utahns ensure the benefits of AI are widely shared and risks are responsibly managed?',
		polisId: '3itaahejzh', // default — override via PUBLIC_POLIS_ID_UTAH env var
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
		polisId: '', // set via PUBLIC_POLIS_ID_OREGON env var
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
	polisId: '', // set via PUBLIC_POLIS_ID_GENERIC env var
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
