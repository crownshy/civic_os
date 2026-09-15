// Covers @civicos/shared/data/faq. The tests live here because `shared` has no
// test runner of its own, the same reason `rich-text.test.ts` does.
//
// The round trip is what matters: admin writes the markup and civicos parses it,
// so a serializer that disagrees with the parser silently eats a Host's FAQ.
import { describe, expect, it } from 'vitest';
import {
	faqAnswerToHtml,
	faqAnswerToText,
	readFaqs,
	toFaqKey,
	toFaqsHtml,
	type FaqEntry
} from '@civicos/shared/data/faq';

const roundTrip = (entries: FaqEntry[]) => readFaqs(toFaqsHtml(entries));
const entry = (question: string, answer: string): FaqEntry => ({
	question,
	answer: faqAnswerToHtml(answer)
});

describe('readFaqs', () => {
	it('reads an absent value as no entries', () => {
		expect(readFaqs(null)).toEqual([]);
		expect(readFaqs(undefined)).toEqual([]);
		expect(readFaqs('')).toEqual([]);
	});

	it('splits one heading per question', () => {
		expect(readFaqs('<h2>First?</h2><p>One.</p><h2>Second?</h2><p>Two.</p>')).toEqual([
			{ question: 'First?', answer: '<p>One.</p>' },
			{ question: 'Second?', answer: '<p>Two.</p>' }
		]);
	});

	it('drops copy before the first heading, which is not an FAQ', () => {
		expect(readFaqs('<p>lead</p><h2>Q?</h2><p>A.</p>')).toEqual([
			{ question: 'Q?', answer: '<p>A.</p>' }
		]);
	});

	it('keeps a question whose answer is empty', () => {
		expect(readFaqs('<h2>Unanswered?</h2>')).toEqual([{ question: 'Unanswered?', answer: '' }]);
	});

	it('parses the markup the backend stores', () => {
		expect(
			readFaqs('<h2>Edited question?</h2><p>Edited answer with an &amp; and a &lt;.</p>')
		).toEqual([
			{ question: 'Edited question?', answer: '<p>Edited answer with an &amp; and a &lt;.</p>' }
		]);
	});
});

describe('toFaqsHtml', () => {
	it('escapes a question so it cannot open a tag', () => {
		expect(toFaqsHtml([entry('Is 1 < 2?', 'Yes.')])).toBe('<h2>Is 1 &lt; 2?</h2><p>Yes.</p>');
	});

	it('skips an entry with no question, which has nothing to parse back', () => {
		expect(toFaqsHtml([entry('  ', 'Orphaned.'), entry('Real?', 'Yes.')])).toBe(
			'<h2>Real?</h2><p>Yes.</p>'
		);
	});
});

describe('the round trip', () => {
	it('survives a plain answer', () => {
		const rows = [entry('Who can participate?', 'Anyone in the region.')];
		expect(roundTrip(rows)).toEqual(rows);
	});

	it('survives entities in both halves', () => {
		const rows = [entry('Q with < & >?', 'a < b & c')];
		const [out] = roundTrip(rows);
		expect(out.question).toBe('Q with < & >?');
		expect(faqAnswerToText(out.answer)).toBe('a < b & c');
	});

	it('keeps paragraph and line breaks in an answer', () => {
		const text = 'Para one\nsame para\n\nPara two';
		const [out] = roundTrip([entry('Q?', text)]);
		expect(faqAnswerToText(out.answer)).toBe(text);
	});

	it('is stable across a second pass, so re-saving does not drift', () => {
		const once = roundTrip([entry('Q?', 'A.\n\nB.')]);
		expect(roundTrip(once)).toEqual(once);
	});
});

describe('faqAnswerToText', () => {
	it('collapses a heading a Host somehow left inside an answer', () => {
		expect(faqAnswerToText('<p>One.</p><h3>Two</h3><p>Three.</p>')).toBe('One.\n\nTwo\n\nThree.');
	});

	it('reads an empty answer as an empty string', () => {
		expect(faqAnswerToText('')).toBe('');
	});
});

describe('toFaqKey', () => {
	it('keeps duplicate questions distinct', () => {
		expect(toFaqKey('Same?', 0)).not.toBe(toFaqKey('Same?', 1));
	});

	it('survives a question with no alphanumerics', () => {
		expect(toFaqKey('???', 2)).toBe('2-');
	});
});
