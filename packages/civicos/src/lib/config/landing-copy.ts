import { campaignPath } from '@civicos/shared/data/place';

/**
 * Shared landing-page copy and structure.
 *
 * Anything in this file is identical across all Regions. Per-region content
 * (hero header, hosts blurb, partners, FAQ, etc.) lives in `regions.ts`.
 *
 * See: docs/adr/0001-landing-bypasses-appshell.md for the architecture context.
 */

/** One pill in the sticky nav. `id` is the anchor it scrolls to. */
export interface NavSection {
	id: string;
	label: string;
}

/**
 * Pill nav sections, in order. The `id` matches the anchor on the corresponding
 * section in `/landing/+page.svelte`; the StickyNav component uses it for
 * IntersectionObserver targets and click-to-scroll.
 *
 * `context` is a placeholder: the landing page expands it into one pill per
 * heading the Host wrote in their Context copy. The order still lives here so
 * there is one place that says where those pills sit.
 */
export const NAV_SECTIONS: NavSection[] = [
	{ id: 'join', label: 'JOIN' },
	{ id: 'context', label: 'CONTEXT' },
	{ id: 'how-it-works', label: 'HOW IT WORKS' },
	{ id: 'your-host', label: 'YOUR HOST' },
	{ id: 'whats-next', label: "WHAT'S NEXT" },
	{ id: 'faq', label: 'FAQ' }
];

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

/**
 * Footer links for a Campaign's own pages.
 *
 * The Open Poll link has to be built per Campaign: there is no top-level
 * `/contribute` any more, only `/<org>/conversations/<campaign>/contribute`, so
 * the old fixed path 404'd on every Campaign. `/conversations` stays absolute,
 * because that one is the cross-Campaign directory rather than this Campaign's.
 */
export function footerLinks(
	campaignSlug: string | undefined,
	orgSlug: string | undefined
): FooterLink[] {
	return [
		{ label: 'Take the Open Poll', href: campaignPath(campaignSlug, orgSlug, 'contribute') },
		...FOOTER_LINKS
	];
}

const FOOTER_LINKS: FooterLink[] = [
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

/**
 * Subtitles on the end page's CTA cards.
 *
 * Fixed, not per-Campaign. These were `regions.ts`'s `endCtaJoinDescription`
 * and `endCtaShareDescription`, which meant a Campaign created in admin got the
 * USA catch-all's wording and no Host could change it anyway. Both describe the
 * mechanic rather than the place, so there is nothing to configure.
 */
export const END_CTA_COPY = {
	join: 'Community conversations are taking place in person and online.',
	share: 'Anyone in your community is welcome to participate.'
} as const;

/**
 * The line under the hero title.
 *
 * Fixed, not per-Campaign. It was `regions.ts`'s `heroBlurb`, which named a
 * state and a demonym, so every Campaign created in admin invited people to
 * weigh in on how AI is changing America. The Campaign title above it already
 * says what this is; this says what a participant is being asked to do.
 */
export const HERO_BLURB =
	'Share your thoughts with others in your community who are weighing in on this question.';
