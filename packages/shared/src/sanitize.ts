/**
 * Host-authored copy is rendered with {@html}. Today it comes from the
 * developer-authored `regions.ts`, so it is trusted; once #398 serves it from
 * Campaign configuration, anyone who can edit a Campaign is writing HTML that
 * runs in every participant's browser.
 *
 * Sanitizing happens here, on the way out, rather than in Comhairle on the way
 * in: it also covers rows written before any write-side validation existed, and
 * it covers `regions.ts`, which never passes through the backend at all.
 * Validation on write is still worth adding as a second layer.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * The union of what Tiptap emits in admin's Setup editor (StarterKit with
 * `code`, `codeBlock` and `horizontalRule` off, headings capped to 2 and 3) and
 * what `regions.ts` already uses. `h4` is here because #414 demotes heading
 * levels on render. `b` and `i` are not produced by the editor but survive a
 * paste from Word or Google Docs, and dropping them silently would lose a
 * Host's emphasis.
 */
const ALLOWED_TAGS = [
	'p',
	'br',
	'h2',
	'h3',
	'h4',
	'ul',
	'ol',
	'li',
	'blockquote',
	'a',
	'strong',
	'b',
	'em',
	'i',
	'u',
	's',
	'span'
];

/**
 * No `class`. Tailwind's utilities are in the bundle, so an allowlisted `class`
 * would let a Host position an element over the page and mount a redressing
 * attack. Presentation belongs to the surface: containers style their own
 * descendants with `[&_a]:…` utilities.
 */
const ALLOWED_ATTR = ['href', 'target', 'rel'];

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Resolving against a base is what makes relative hrefs (`#context`, `/report`)
 * come out as https rather than needing their own pattern. The base is never
 * used for anything but reading back the protocol.
 */
function hasSafeHref(value: string): boolean {
	try {
		return ALLOWED_PROTOCOLS.has(new URL(value, 'https://sanitizer.invalid').protocol);
	} catch {
		return false;
	}
}

/**
 * The same protocol check for a url bound straight to an `href` attribute.
 * Svelte does not vet attribute values, so a `javascript:` url in Host-supplied
 * data (a Partner's link, say) would run on click. Returns undefined for
 * anything not allowed, which drops the attribute.
 */
export function safeHref(value: string | null | undefined): string | undefined {
	if (!value) return undefined;
	return hasSafeHref(value) ? value : undefined;
}

// Hooks are registered on the shared DOMPurify instance, so this runs once at
// module load rather than per call. It only inspects anchors.
DOMPurify.addHook('afterSanitizeAttributes', (el: Element) => {
	if (typeof el.getAttribute !== 'function' || el.tagName !== 'A') return;

	const href = el.getAttribute('href');
	if (href !== null && !hasSafeHref(href)) el.removeAttribute('href');

	// A Host can set target, but never at the cost of handing the opener window
	// to whatever they linked to.
	if (el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer');
	else el.removeAttribute('target');
});

/** Render-ready HTML for copy a Host may have authored. */
export function sanitizeHostHtml(value: string | null | undefined): string {
	if (!value) return '';

	return DOMPurify.sanitize(value, {
		ALLOWED_TAGS,
		ALLOWED_ATTR,
		ALLOW_DATA_ATTR: false,
		ALLOW_ARIA_ATTR: false
	});
}
