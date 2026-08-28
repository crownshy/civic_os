import { describe, expect, it } from 'vitest';
import { sanitizeHostHtml } from '@civicos/shared/sanitize';

// The util lives in `shared`, which has no test runner. These run in civicos's
// `server` vitest project (node environment), which is the SSR path and the one
// that goes through isomorphic-dompurify's jsdom rather than a real DOM.

describe('sanitizeHostHtml', () => {
	it('returns an empty string for absent copy', () => {
		expect(sanitizeHostHtml('')).toBe('');
		expect(sanitizeHostHtml(null)).toBe('');
		expect(sanitizeHostHtml(undefined)).toBe('');
	});

	it('keeps the tags the Setup editor emits', () => {
		const html =
			'<h2>Heading</h2><h3>Sub</h3><p>Text with <strong>bold</strong>, <em>italic</em>, ' +
			'<u>underline</u> and <s>strike</s>.</p><ul><li>one</li></ul><ol><li>two</li></ol>' +
			'<blockquote>quoted</blockquote>';

		expect(sanitizeHostHtml(html)).toBe(html);
	});

	it('keeps the tags regions.ts already uses', () => {
		expect(sanitizeHostHtml('<span>step</span><br><b>b</b><i>i</i>')).toBe(
			'<span>step</span><br><b>b</b><i>i</i>'
		);
	});

	describe('script execution', () => {
		it('drops script elements and their contents', () => {
			expect(sanitizeHostHtml('<p>before</p><script>alert(1)</script><p>after</p>')).toBe(
				'<p>before</p><p>after</p>'
			);
		});

		it('drops inline event handlers', () => {
			expect(sanitizeHostHtml('<p onclick="alert(1)">click</p>')).toBe('<p>click</p>');
			expect(sanitizeHostHtml('<img src=x onerror="alert(1)">')).toBe('');
		});

		it('drops javascript: and data: hrefs but keeps the link text', () => {
			expect(sanitizeHostHtml('<a href="javascript:alert(1)">go</a>')).toBe('<a>go</a>');
			expect(sanitizeHostHtml('<a href="data:text/html,<script>alert(1)</script>">go</a>')).toBe(
				'<a>go</a>'
			);
		});

		it('is not fooled by casing or whitespace in a scheme', () => {
			expect(sanitizeHostHtml('<a href="JaVaScRiPt:alert(1)">go</a>')).toBe('<a>go</a>');
			expect(sanitizeHostHtml('<a href=" javascript:alert(1)">go</a>')).toBe('<a>go</a>');
			expect(sanitizeHostHtml('<a href="java\tscript:alert(1)">go</a>')).toBe('<a>go</a>');
		});

		it('drops embedding and styling elements outright', () => {
			expect(sanitizeHostHtml('<iframe src="https://evil.test"></iframe>')).toBe('');
			expect(sanitizeHostHtml('<style>body{display:none}</style>')).toBe('');
			expect(sanitizeHostHtml('<form action="https://evil.test"><input name="a"></form>')).toBe('');
		});
	});

	describe('hrefs', () => {
		it('keeps absolute, mail, tel, relative and anchor targets', () => {
			for (const href of [
				'https://cocap.us/',
				'http://cocap.us',
				'mailto:hello@bloom-project.org',
				'tel:+15551234567',
				'/report',
				'#context'
			]) {
				expect(sanitizeHostHtml(`<a href="${href}">link</a>`)).toBe(`<a href="${href}">link</a>`);
			}
		});

		it('drops schemes outside the allowlist', () => {
			expect(sanitizeHostHtml('<a href="ftp://files.test/x">go</a>')).toBe('<a>go</a>');
			expect(sanitizeHostHtml('<a href="vbscript:msgbox(1)">go</a>')).toBe('<a>go</a>');
		});
	});

	describe('attributes', () => {
		it('strips class so Hosts cannot borrow Tailwind utilities', () => {
			expect(sanitizeHostHtml('<a href="#context" class="text-destructive">Learn more</a>')).toBe(
				'<a href="#context">Learn more</a>'
			);
			expect(sanitizeHostHtml('<span class="fixed inset-0 z-50 bg-white">overlay</span>')).toBe(
				'<span>overlay</span>'
			);
		});

		it('forces rel on new-tab links and drops other targets', () => {
			expect(sanitizeHostHtml('<a href="https://cocap.us/" target="_blank">go</a>')).toBe(
				'<a href="https://cocap.us/" target="_blank" rel="noopener noreferrer">go</a>'
			);
			expect(
				sanitizeHostHtml('<a href="https://cocap.us/" target="_blank" rel="opener">go</a>')
			).toBe('<a href="https://cocap.us/" target="_blank" rel="noopener noreferrer">go</a>');
			expect(sanitizeHostHtml('<a href="/report" target="_top">go</a>')).toBe(
				'<a href="/report">go</a>'
			);
		});

		it('strips id, style and data attributes', () => {
			expect(sanitizeHostHtml('<p id="context" style="position:fixed" data-x="1">text</p>')).toBe(
				'<p>text</p>'
			);
		});
	});

	it('normalizes malformed markup instead of passing it through', () => {
		// An unclosed attribute quote, the shape regions.ts carried at the span
		// this replaced, swallows the following text when the browser parses it.
		const repaired = sanitizeHostHtml("<span class='font-bold >Step 1: This Poll</span>");
		expect(repaired).not.toContain('font-bold');
		expect(repaired).not.toContain('class');
	});
});
