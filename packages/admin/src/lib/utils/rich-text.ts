// The shape helpers moved to @civicos/shared so civicos can render the same
// field. Re-exported here for the existing `$lib/utils/rich-text` imports.
export { isHtml, toRichTextHtml } from '@civicos/shared/rich-text';

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
