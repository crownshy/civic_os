import { describe, expect, it } from 'vitest';
import { isHtml, toRichTextHtml } from './rich-text';

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
