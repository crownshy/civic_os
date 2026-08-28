import { describe, expect, it } from 'vitest';
import { REGIONS } from '@civicos/shared/data/regions';
import { renderHostCopy, resolveHostCopy } from './host-copy';
import type { RegionConfig } from './regions';

const oregon = REGIONS.oregon as RegionConfig;

describe('resolveHostCopy', () => {
	it('falls back to the region when there is no conversation', () => {
		const copy = resolveHostCopy(null, oregon);

		expect(copy.context).toContain('AI is reshaping Central Oregon');
		expect(copy.whatsNext).not.toBe('');
	});

	it('turns the region paragraph array into block HTML', () => {
		const copy = resolveHostCopy(null, oregon);

		expect(copy.context.startsWith('<p>')).toBe(true);
		expect(copy.context.match(/<p>/g)?.length).toBe(oregon.contextParagraphs.length);
	});

	it('prefers the conversation when it has copy', () => {
		const copy = resolveHostCopy(
			{ description: '<p>Host wrote this.</p>', thankYouMessage: '<p>And this.</p>' },
			oregon
		);

		expect(copy.context).toBe('<p>Host wrote this.</p>');
		expect(copy.whatsNext).toBe('<p>And this.</p>');
	});

	it('treats blank and whitespace-only backend copy as absent', () => {
		for (const description of ['', '   ', null, undefined]) {
			const copy = resolveHostCopy({ description }, oregon);
			expect(copy.context).toContain('AI is reshaping Central Oregon');
		}
	});

	it('gives legacy plain text paragraph structure', () => {
		const copy = resolveHostCopy({ description: 'First line.\n\nSecond line.' }, oregon);

		expect(copy.context).toBe('<p>First line.</p><p>Second line.</p>');
	});

	it('resolves the two fields independently', () => {
		const copy = resolveHostCopy({ description: '<p>Only context.</p>' }, oregon);

		expect(copy.context).toBe('<p>Only context.</p>');
		expect(copy.whatsNext).toContain('<p>');
	});
});

describe('renderHostCopy', () => {
	it('demotes editor headings so they sit under the section heading', () => {
		expect(renderHostCopy('<h2>Section</h2><h3>Sub</h3>')).toBe('<h3>Section</h3><h4>Sub</h4>');
	});

	it('sanitizes before rendering', () => {
		expect(renderHostCopy('<p onclick="alert(1)">hi</p><script>alert(1)</script>')).toBe(
			'<p>hi</p>'
		);
	});

	it('leaves paragraphs and lists alone', () => {
		const html = '<p>One</p><ul><li>Two</li></ul>';
		expect(renderHostCopy(html)).toBe(html);
	});
});
