/**
 * `Conversation.description` was a plain-text field before Setup grew a
 * rich-text editor, and existing rows are still plain text with newlines.
 * Anything that edits or renders the field normalizes through here first: HTML
 * passes straight through, plain text gets escaped and given paragraph
 * structure so a legacy value does not collapse onto one line.
 *
 * Prose styling is not here. It is per-app, because `admin` and `civicos` size
 * text on different scales.
 */

const HTML_TAG = /<[a-z][a-z0-9]*\b[^>]*>/i;

export function isHtml(value: string): boolean {
	return HTML_TAG.test(value);
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Editor- and render-ready HTML for a value that may still be plain text. */
export function toRichTextHtml(value: string): string {
	const text = value.trim();
	if (text === '') return '';
	if (isHtml(text)) return text;

	return text
		.split(/\n{2,}/)
		.map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
		.join('');
}

/**
 * Shifts `h2`/`h3` down one level. The Setup editor emits `h2` and `h3`, but the
 * surfaces that render this copy already use `h2` for their own section
 * headings, so promoting Host headings straight into the page produces sibling
 * h2s and a heading outline that reads wrong. Demoting on render rather than
 * changing what the editor stores keeps the stored content independent of
 * whichever surface shows it. See #414.
 *
 * Run this after sanitizing, on markup that is already well formed.
 */
export function demoteHeadings(html: string): string {
	return html.replace(
		/<(\/?)h([23])\b([^>]*)>/gi,
		(_match, slash: string, level: string, rest: string) => `<${slash}h${Number(level) + 1}${rest}>`
	);
}

const BLOCK_START = /^\s*<(p|ul|ol|h[1-6]|blockquote|div|table|pre|figure|section)\b/i;

/**
 * Block HTML for a value that may be any of the three shapes this copy arrives
 * in: editor output that already opens with a block element, a single paragraph
 * carrying inline markup (`<a>`, `<strong>`), which is what most of
 * `regions.ts` holds, or legacy plain text.
 *
 * `toRichTextHtml` alone is not enough here. It treats "contains a tag" as
 * "is block HTML", so an inline-only string comes back unwrapped and lands in a
 * block container with no paragraph around it.
 */
export function toBlockHtml(value: string): string {
	const text = value.trim();
	if (text === '') return '';
	if (BLOCK_START.test(text)) return text;
	// Inline markup is wrapped rather than escaped; the sanitizer is what makes
	// it safe to render.
	if (isHtml(text)) return `<p>${text}</p>`;
	return toRichTextHtml(text);
}

/** Block HTML for copy held as one paragraph per array entry. */
export function paragraphsToHtml(paragraphs: readonly string[]): string {
	return paragraphs.map(toBlockHtml).join('');
}
