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

export function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Paragraph HTML for plain text: a blank line opens a new paragraph, a single
 * newline is a `<br>` within one.
 *
 * Escaping is unconditional, which is what separates this from
 * `toRichTextHtml`: that function treats "contains a tag" as "is already HTML"
 * and passes the value through. Callers holding text that is known to be plain
 * (a textarea, not an editor) want the escape, so they come here.
 */
export function plainTextToParagraphs(text: string): string {
	return text
		.split(/\n{2,}/)
		.map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
		.join('');
}

/** Editor- and render-ready HTML for a value that may still be plain text. */
export function toRichTextHtml(value: string): string {
	const text = value.trim();
	if (text === '') return '';
	if (isHtml(text)) return text;

	return plainTextToParagraphs(text);
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

/** A Host heading and the block HTML that runs under it. */
export interface RichTextSection {
	/** Heading text, markup stripped. Empty only for the lead block. */
	heading: string;
	/** Everything up to the next heading. */
	html: string;
}

const ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	'#39': "'"
};

function decodeEntities(text: string): string {
	return text.replace(/&(amp|lt|gt|quot|#39);/g, (_match, name: string) => ENTITIES[name]);
}

/** Heading markup down to the text a nav pill can carry. */
function toPlainText(html: string): string {
	return decodeEntities(html.replace(/<[^>]*>/g, ''))
		.replace(/\s+/g, ' ')
		.trim();
}

const BLOCK_END = /<\/(p|div|li|h[1-6]|blockquote|tr)\s*>/gi;
const LINE_BREAK = /<br\s*\/?>/gi;

/**
 * Block HTML back down to plain text, paragraph breaks intact.
 *
 * `toPlainText` is the wrong tool for a body of copy: it flattens all
 * whitespace to single spaces, so two paragraphs come back as one line. This
 * is the inverse of `plainTextToParagraphs`, and round-trips with it.
 */
export function blockHtmlToPlainText(html: string): string {
	return decodeEntities(
		html
			.replace(LINE_BREAK, '\n')
			.replace(BLOCK_END, '\n\n')
			.replace(/<[^>]*>/g, '')
	)
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * Splits block HTML at every `h2`, the level the Setup editor's Heading button
 * writes, into the lead block and one entry per heading. A surface that gives
 * each heading its own section and nav pill needs the heading text separate
 * from the copy under it, which is not something `{@html}` on one blob can do.
 *
 * The returned `html` still holds whatever nested headings the Host wrote, so
 * run `demoteHeadings` on it as before.
 */
export function splitAtHeadings(html: string): RichTextSection[] {
	// A capturing group interleaves the captures between the parts, so this
	// reads [lead, heading, body, heading, body, ...].
	const parts = html.split(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
	const sections: RichTextSection[] = [];

	const lead = parts[0].trim();
	if (lead !== '') sections.push({ heading: '', html: lead });

	for (let i = 1; i < parts.length; i += 2) {
		const heading = toPlainText(parts[i]);
		const body = (parts[i + 1] ?? '').trim();

		// An empty heading has no label to put on a pill, so its copy joins what
		// came before rather than opening a section nothing can link to.
		if (heading === '') {
			const previous = sections.at(-1);
			if (previous) previous.html += body;
			else if (body !== '') sections.push({ heading: '', html: body });
			continue;
		}

		sections.push({ heading, html: body });
	}

	return sections;
}
