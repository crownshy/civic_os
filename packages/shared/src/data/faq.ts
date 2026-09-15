/**
 * The FAQ a Host authors for a Campaign, and the format it is stored in.
 *
 * `Conversation.faqs` is one rich-text field, not a table of questions: it is a
 * TextContent reference like `title` and `description`, and it goes through the
 * same translation pipeline. So the list is encoded in the markup, one `h2` per
 * question and the blocks under it as the answer, which is exactly what
 * `splitAtHeadings` already parses for the landing page's Context sections.
 *
 * That encoding is the whole reason this module exists. Both apps go through it
 * so the surface that writes the format and the surface that renders it cannot
 * disagree about it, the same contract `place.ts` draws for a Place (ADR 0003).
 *
 * An `FaqEntry` is storage-shaped: `answer` is block HTML, which is what the
 * accordion renders. `faqAnswerToText` / `faqAnswerToHtml` convert at the one
 * boundary where that is the wrong shape, admin's plain-text answer field.
 *
 * The round trip is lossy by construction. Anything in `faqs` that is not a
 * heading followed by blocks is dropped the next time a Host saves from the row
 * editor. Plain-text answers keep that narrow, because the editor only emits
 * the tags this module parses back.
 */

import {
	blockHtmlToPlainText,
	escapeHtml,
	plainTextToParagraphs,
	splitAtHeadings
} from '../rich-text';

/** One question and its answer. `answer` is block HTML. */
export interface FaqEntry {
	question: string;
	answer: string;
}

/**
 * The entries stored in a `Conversation.faqs` value.
 *
 * An entry needs a question, so copy before the first heading is not an FAQ and
 * is dropped rather than rendered as a row with no question to open it.
 */
export function readFaqs(faqs: string | null | undefined): FaqEntry[] {
	if (!faqs) return [];

	return splitAtHeadings(faqs)
		.filter((section) => section.heading !== '')
		.map((section) => ({ question: section.heading, answer: section.html }));
}

/**
 * Entries back to the stored markup. Questions are escaped rather than trusted:
 * the value came from a text input, and a question containing `<` must survive
 * the trip rather than opening a tag.
 */
export function toFaqsHtml(entries: readonly FaqEntry[]): string {
	return entries
		.filter((entry) => entry.question.trim() !== '')
		.map((entry) => `<h2>${escapeHtml(entry.question.trim())}</h2>${entry.answer}`)
		.join('');
}

/** A stored answer in the shape admin's plain-text field edits. */
export function faqAnswerToText(answer: string): string {
	return blockHtmlToPlainText(answer);
}

/** A plain-text answer in the shape it is stored and rendered as. */
export function faqAnswerToHtml(text: string): string {
	const trimmed = text.trim();
	return trimmed === '' ? '' : plainTextToParagraphs(trimmed);
}

/** Slug for keying a row in the editor. Not stored; the markup has no ids. */
export function toFaqKey(question: string, index: number): string {
	const slug = question
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	// Two identical questions are a mistake, not a crash: the index keeps the
	// keys unique so `{#each}` still tracks the rows apart.
	return `${index}-${slug}`;
}
