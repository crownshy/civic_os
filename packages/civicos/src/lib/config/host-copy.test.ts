import { describe, expect, it } from 'vitest';
import { REGIONS } from '@civicos/shared/data/regions';
import { renderHostCopy, resolveHostCopy, toContextSections } from './host-copy';
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

describe('toContextSections', () => {
	it('keeps a description with no headings as the one Context section', () => {
		const [section, ...rest] = toContextSections('<p>Just prose.</p>');

		expect(rest).toEqual([]);
		expect(section).toEqual({
			id: 'context',
			label: 'CONTEXT',
			heading: 'Context',
			html: '<p>Just prose.</p>'
		});
	});

	it('opens a section at every heading', () => {
		const sections = toContextSections(
			'<p>Lead.</p><h2>Who gets a seat?</h2><p>A.</p><h2>What adults do</h2><p>B.</p>'
		);

		expect(sections.map((s) => [s.id, s.label, s.html])).toEqual([
			['context', 'CONTEXT', '<p>Lead.</p>'],
			['context-who-gets-a-seat', 'WHO GETS A SEAT?', '<p>A.</p>'],
			['context-what-adults-do', 'WHAT ADULTS DO', '<p>B.</p>']
		]);
	});

	it('drops the Context section when the copy opens on a heading', () => {
		const sections = toContextSections('<h2>Straight in</h2><p>A.</p>');

		expect(sections.map((s) => s.id)).toEqual(['context-straight-in']);
	});

	it('demotes headings nested under a section, since the heading is now the page h2', () => {
		const [section] = toContextSections('<h2>Power</h2><h3>How much?</h3><p>A.</p>');

		expect(section.html).toBe('<h4>How much?</h4><p>A.</p>');
	});

	it('strips markup from a heading before it becomes a label', () => {
		const [section] = toContextSections('<h2>Tokenism &amp; <strong>power</strong></h2><p>A.</p>');

		expect(section.heading).toBe('Tokenism & power');
		expect(section.id).toBe('context-tokenism-power');
	});

	it('keeps ids unique when two headings slug the same', () => {
		const sections = toContextSections('<h2>Next</h2><p>A.</p><h2>Next!</h2><p>B.</p>');

		expect(sections.map((s) => s.id)).toEqual(['context-next', 'context-next-2']);
	});

	it('sanitizes before splitting, so a script tag cannot open a section', () => {
		const sections = toContextSections('<p>A.</p><script>alert(1)</script><h2>B</h2><p>C.</p>');

		expect(sections[0].html).toBe('<p>A.</p>');
		expect(sections.map((s) => s.id)).toEqual(['context', 'context-b']);
	});

	it('gives an empty description no sections at all', () => {
		expect(toContextSections('')).toEqual([]);
	});
});
