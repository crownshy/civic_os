import { describe, expect, it } from 'vitest';
import { isHtml, shortDescriptionFrom, toRichTextHtml } from './rich-text';

describe('toRichTextHtml', () => {
	it('passes HTML through untouched', () => {
		expect(toRichTextHtml('<p>Already <strong>rich</strong>.</p>')).toBe(
			'<p>Already <strong>rich</strong>.</p>'
		);
	});

	it('splits legacy plain text on blank lines', () => {
		expect(toRichTextHtml('First.\n\nSecond.')).toBe('<p>First.</p><p>Second.</p>');
	});

	it('keeps a single newline as a soft break', () => {
		expect(toRichTextHtml('One\ntwo')).toBe('<p>One<br>two</p>');
	});

	it('escapes markup characters in plain text', () => {
		expect(toRichTextHtml('a < b & c')).toBe('<p>a &lt; b &amp; c</p>');
	});

	it('returns an empty string for blank input', () => {
		expect(toRichTextHtml('   \n  ')).toBe('');
	});
});

describe('isHtml', () => {
	it('does not treat a bare comparison as markup', () => {
		expect(isHtml('5 < 6 and 7 > 6')).toBe(false);
	});
});

describe('shortDescriptionFrom', () => {
	it('keeps only the first paragraph, as plain text', () => {
		expect(
			shortDescriptionFrom('<p>Tell us <strong>what</strong> you think.</p><p>More.</p>')
		).toBe('Tell us what you think.');
	});

	it('skips a heading to reach the copy under it', () => {
		expect(shortDescriptionFrom('<h2>Why this matters</h2><p>Your county is deciding.</p>')).toBe(
			'Your county is deciding.'
		);
	});

	it('reads a plain-text description from Create Campaign', () => {
		expect(shortDescriptionFrom('First line & more.\n\nSecond paragraph.')).toBe(
			'First line & more.'
		);
	});

	it('is empty for an empty description', () => {
		expect(shortDescriptionFrom('')).toBe('');
		expect(shortDescriptionFrom('<p></p>')).toBe('');
	});
});
