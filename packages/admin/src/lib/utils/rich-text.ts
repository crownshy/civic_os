/**
 * Conversation.description was a plain-text field before Setup grew a rich-text
 * editor, and existing rows are still plain text with newlines. Anything that
 * edits or renders the field normalizes through here first: HTML passes
 * straight through, plain text gets escaped and given paragraph structure so a
 * legacy value does not collapse onto one line.
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
 * Prose styling for rich-text output. The editor's contenteditable is owned by
 * Tiptap and the read-only view is an {@html} block, so neither can carry
 * per-element utilities; both borrow this instead.
 */
export const RICH_TEXT_PROSE_CLASS = [
	'text-paragraph',
	'[&_p]:mb-3 [&_p:last-child]:mb-0',
	'[&_h2]:mb-2 [&_h2]:text-h4 [&_h2]:font-semibold',
	'[&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium',
	'[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6',
	'[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6',
	'[&_li]:mb-1',
	'[&_blockquote]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border',
	'[&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
	'[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
	'[&_strong]:font-semibold'
].join(' ');
