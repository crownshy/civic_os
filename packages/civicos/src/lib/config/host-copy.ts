import {
	demoteHeadings,
	paragraphsToHtml,
	splitAtHeadings,
	toBlockHtml
} from '@civicos/shared/rich-text';
import { readFaqs, type FaqEntry } from '@civicos/shared/data/faq';
import { sanitizeHostHtml } from '@civicos/shared/sanitize';
import { firstNonEmpty } from '$lib/utils/text';
import type { RegionConfig } from './regions';

/**
 * The two blocks of Campaign copy a Host controls, resolved to block HTML.
 *
 * Both fall back to `regions.ts` so Utah and Oregon render exactly what they
 * render today until a Host saves something. That makes `regions.ts` the
 * default layer rather than the source of truth; it cannot be deleted until
 * every live region has been migrated by hand. See ADR 0003.
 *
 * The two shapes do not match on the way in. `Conversation.description` is one
 * HTML blob (or legacy plain text), while `contextParagraphs` is one paragraph
 * per array entry, so both normalize to block HTML here rather than at each
 * render site.
 */
export interface HostCopy {
	/** Landing "Context" section. */
	context: string;
	/** Landing "What's Next?" section and the Open Poll end screen. */
	whatsNext: string;
}

/** The fields of a Conversation this app reads. Narrowed so the DTO's optionality does not leak. */
export interface ConversationCopy {
	description?: string | null;
	thankYouMessage?: string | null;
	faqs?: string | null;
}

export function resolveHostCopy(
	conversation: ConversationCopy | null | undefined,
	region: RegionConfig
): HostCopy {
	return {
		context: firstNonEmpty(
			conversation?.description && toBlockHtml(conversation.description),
			paragraphsToHtml(region.contextParagraphs)
		),
		whatsNext: firstNonEmpty(
			conversation?.thankYouMessage && toBlockHtml(conversation.thankYouMessage),
			toBlockHtml(region.whatsNext)
		)
	};
}

/** Safe, correctly-levelled HTML for an {@html} block. Sanitize first, then demote. */
export function renderHostCopy(html: string): string {
	return demoteHeadings(sanitizeHostHtml(html));
}

/**
 * The FAQ accordion's entries, from the Conversation when a Host has authored
 * one and from `regions.ts` until then.
 *
 * All or nothing rather than per entry: the two sources are separate lists, and
 * interleaving a Host's questions with the seed placeholders would show a
 * participant both. One saved question means the Host owns the list.
 *
 * `readFaqs` already returns block HTML for an answer, because that is how the
 * field is stored. A `regions.ts` answer is a bare sentence or one paragraph of
 * inline markup, so it goes through `toBlockHtml` to arrive in the same shape.
 */
export function resolveFaq(
	conversation: ConversationCopy | null | undefined,
	region: RegionConfig
): FaqEntry[] {
	const stored = readFaqs(conversation?.faqs);
	if (stored.length > 0) return stored;

	return region.faq.map((entry) => ({
		question: entry.question,
		answer: toBlockHtml(entry.answer)
	}));
}

/**
 * One landing section, with the anchor and pill label the nav needs alongside
 * the copy. Ids are prefixed so a Host heading can never collide with a fixed
 * section id such as `faq`.
 */
export interface ContextSection {
	/** Anchor on the section, and the StickyNav scroll target. */
	id: string;
	/** Nav pill label. Uppercase, like the fixed pills. */
	label: string;
	/** Heading rendered above the copy. */
	heading: string;
	/** Sanitized, correctly-levelled HTML for an {@html} block. */
	html: string;
}

const CONTEXT_ID = 'context';

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * The Context copy as one section per heading the Host wrote, so a long brief
 * reads as a run of linkable sections rather than one wall of text under a
 * single Context pill. See #414 for why the levels shift on the way out.
 *
 * Copy before the first heading keeps the `context` id and the Context
 * heading, which is what a description with no headings at all resolves to.
 * A description that opens on a heading has no lead, and then the Host's own
 * first heading is the first pill.
 */
export function toContextSections(context: string): ContextSection[] {
	const taken = new Set<string>();

	return splitAtHeadings(sanitizeHostHtml(context)).map((section, i) => {
		const html = demoteHeadings(section.html);
		if (section.heading === '')
			return { id: CONTEXT_ID, label: 'CONTEXT', heading: 'Context', html };

		// A heading of nothing but punctuation slugs to '', hence the index.
		const base = `${CONTEXT_ID}-${slugify(section.heading) || i}`;
		let id = base;
		for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
		taken.add(id);

		return { id, label: section.heading.toUpperCase(), heading: section.heading, html };
	});
}

/**
 * Styling for a block of Host copy. The sanitizer strips `class`, so every
 * element in here is styled from the container. Sized on the civicos scale,
 * which is why this is not shared with admin's `RICH_TEXT_PROSE_CLASS`.
 */
export const HOST_COPY_PROSE_CLASS = [
	'font-sans text-base leading-6 font-medium md:text-lg md:leading-7',
	'[&_p]:mb-7 [&_p:last-child]:mb-0',
	'[&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-medium md:[&_h3]:text-2xl',
	'[&_h4]:mb-2 [&_h4]:font-display [&_h4]:text-lg [&_h4]:font-medium',
	'[&_ul]:mb-7 [&_ul]:list-disc [&_ul]:pl-6',
	'[&_ol]:mb-7 [&_ol]:list-decimal [&_ol]:pl-6',
	'[&_li]:mb-1',
	'[&_blockquote]:mb-7 [&_blockquote]:border-l-2 [&_blockquote]:border-foreground/20',
	'[&_blockquote]:pl-4',
	'[&_a]:text-destructive [&_a]:underline'
].join(' ');
