import { demoteHeadings, paragraphsToHtml, toBlockHtml } from '@civicos/shared/rich-text';
import { sanitizeHostHtml } from '@civicos/shared/sanitize';
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
}

function firstNonEmpty(...values: (string | null | undefined)[]): string {
	for (const value of values) {
		if (value && value.trim() !== '') return value;
	}
	return '';
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
