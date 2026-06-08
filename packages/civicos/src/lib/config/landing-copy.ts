/**
 * Shared landing-page copy and structure.
 *
 * Anything in this file is identical across all Regions. Per-region content
 * (hero header, hosts blurb, partners, FAQ, etc.) lives in `regions.ts`.
 *
 * See: docs/adr/0001-landing-bypasses-appshell.md for the architecture context.
 */

/**
 * Pill nav sections, in order. The `id` matches the anchor on the corresponding
 * section in `/landing/+page.svelte`; the StickyNav component uses it for
 * IntersectionObserver targets and click-to-scroll.
 */
export const NAV_SECTIONS = [
	{ id: 'join', label: 'JOIN' },
	{ id: 'context', label: 'CONTEXT' },
	{ id: 'how-it-works', label: 'HOW IT WORKS' },
	{ id: 'your-host', label: 'YOUR HOST' },
	{ id: 'whats-next', label: "WHAT'S NEXT" },
	{ id: 'faq', label: 'FAQ' }
] as const;

export type NavSectionId = (typeof NAV_SECTIONS)[number]['id'];

/**
 * Body paragraphs for the "What is an 'Open Poll'?" section.
 * Identical for every Region — the mechanic is the same everywhere.
 */
export const OPEN_POLL_EXPLAINER: string[] = [
	"The Open Poll isn't a traditional survey. Anyone can add their own thoughts to be considered by others. It then takes all the contributions and votes to measure the community's full opinion landscape, showing where people agree, where they diverge, and what common ground already exists.",
	"You'll see statements submitted by other community members about this question. You can vote: agree, disagree, or unsure… or add your own thoughts.",
	"Your responses — combined with everyone else's — will help surface what we have in common, where we differ, and what we might tackle together."
];

/** Footer link configuration. `href` may be a route path or external URL. */
export interface FooterLink {
	label: string;
	href: string;
	external?: boolean;
}

export const FOOTER_LINKS: FooterLink[] = [
	{ label: 'Take the Open Poll', href: '/contribute' },
	{ label: 'Join a Community Conversation', href: '/conversations' },
	{ label: 'About BLOOM Project', href: 'https://www.bloom-project.org/', external: true },
	{
		label: 'Terms and Conditions',
		href: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1',
		external: true
	},
	{
		label: 'Privacy Policy',
		href: 'https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1',
		external: true
	}
];
