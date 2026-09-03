import { describe, expect, it } from 'vitest';
import { claimPhrase, countLabel, demoLineFor, emojiFor, titleCaseChip } from './copy';
import type { ReportRecord } from './types';

const record = (over: Partial<ReportRecord> = {}): ReportRecord => ({
	id: 'p1',
	kind: 'poll',
	text: 't',
	origin: 'participant',
	place: null,
	chips: [],
	vote: null,
	source: 'Open Poll',
	tags: [],
	inReport: true,
	...over
});

describe('titleCaseChip', () => {
	it('keeps OR uppercase when it is the state abbreviation', () => {
		expect(titleCaseChip('BEND, OR')).toBe('Bend, OR');
	});

	it('lowercases the same word when it is the conjunction', () => {
		// the whole reason the special case exists; these two differ only by
		// the comma before them
		expect(titleCaseChip('WHITE OR CAUCASIAN')).toBe('White or Caucasian');
	});

	it('title-cases an ordinary chip', () => {
		expect(titleCaseChip('LISTENING SESSION')).toBe('Listening Session');
	});
});

describe('emojiFor', () => {
	it('gives a seed to anything not tied to one person', () => {
		expect(emojiFor(record({ origin: 'cocap_seed' }))).toBe('🌱');
		expect(emojiFor(record({ origin: 'listening_session' }))).toBe('🌱');
	});

	it('picks the base emoji from gender', () => {
		expect(emojiFor(record({ chips: ['FEMALE'] }))).toBe('👩');
		expect(emojiFor(record({ chips: ['MALE'] }))).toBe('👨');
		expect(emojiFor(record({ chips: ['OTHER'] }))).toBe('🧑');
	});

	it('ages the emoji for the older buckets', () => {
		expect(emojiFor(record({ chips: ['FEMALE', '65+'] }))).toBe('👵');
		expect(emojiFor(record({ chips: ['MALE', '55-64'] }))).toBe('👴');
		expect(emojiFor(record({ chips: ['55-64'] }))).toBe('🧓');
	});

	it('appends a skin-tone modifier from the race chip', () => {
		expect(emojiFor(record({ chips: ['FEMALE', 'WHITE OR CAUCASIAN'] }))).toBe('👩🏻');
		expect(emojiFor(record({ chips: ['MALE', 'NATIVE AMERICAN'] }))).toBe('👨🏽');
	});

	it('falls back to a neutral person when no chip says otherwise', () => {
		expect(emojiFor(record({ chips: [] }))).toBe('🧑');
	});
});

describe('demoLineFor', () => {
	it('names a host statement rather than inventing a person', () => {
		expect(demoLineFor(record({ origin: 'cocap_seed', chips: ['FEMALE'] }))).toBe('Host statement');
	});

	it('combines gender and place when it has both', () => {
		expect(demoLineFor(record({ chips: ['FEMALE'], place: 'Bend' }))).toBe('Woman from Bend');
		expect(demoLineFor(record({ chips: ['MALE'], place: 'Sisters' }))).toBe('Man from Sisters');
	});

	it('uses a neutral noun when gender is missing but place is known', () => {
		expect(demoLineFor(record({ chips: [], place: 'Bend' }))).toBe('Person from Bend');
	});

	it('drops to gender alone without a place', () => {
		expect(demoLineFor(record({ chips: ['FEMALE'] }))).toBe('Woman');
	});

	it('falls back when it knows neither', () => {
		expect(demoLineFor(record({ chips: [] }))).toBe('Community member');
	});
});

describe('countLabel', () => {
	it('pluralises each side independently', () => {
		expect(countLabel(1, 1)).toBe('1 statement · 1 quote');
		expect(countLabel(26, 4)).toBe('26 statements · 4 quotes');
		expect(countLabel(0, 0)).toBe('0 statements · 0 quotes');
	});
});

describe('claimPhrase', () => {
	it('uses a claim already phrased as "People agree…" verbatim', () => {
		// rather than double-wrapping it into "People agree that People agree…"
		const { toc, head } = claimPhrase(
			'People disagree about whether AI is owned publicly',
			'agree'
		);
		expect(toc).toBe('People DISAGREE about whether AI is owned publicly');
		expect(head).toEqual({
			before: 'People ',
			emphasis: 'disagree',
			after: ' about whether AI is owned publicly.',
			tone: 'disagree'
		});
	});

	it('lowercases an ordinary opening word so it can follow "agree that"', () => {
		const { toc, head } = claimPhrase('Communities should be involved', 'agree');
		expect(toc).toBe('People AGREE that communities should be involved');
		expect(head).toEqual({
			before: 'People generally ',
			emphasis: 'agree',
			after: ' that communities should be involved.',
			tone: 'agree'
		});
	});

	it('leaves an opening acronym capitalised', () => {
		expect(claimPhrase('AI should be regulated', 'agree').toc).toBe(
			'People AGREE that AI should be regulated'
		);
	});

	it('phrases divided and mixed without a tone colour', () => {
		expect(claimPhrase('data centers help', 'divided').head).toEqual({
			before: 'People are ',
			emphasis: 'divided',
			after: ' over whether data centers help.',
			tone: null
		});
		expect(claimPhrase('data centers help', 'mixed').head).toEqual({
			before: 'People have ',
			emphasis: 'mixed',
			after: ' views on whether data centers help.',
			tone: null
		});
	});

	it('treats an unrecognised direction as mixed rather than rendering nothing', () => {
		const phrase = claimPhrase('data centers help', 'sideways' as never);
		expect(phrase.toc).toBe('People are MIXED on whether data centers help');
		expect(phrase.head.emphasis).toBe('mixed');
	});

	it('does not throw on an empty claim', () => {
		expect(() => claimPhrase('', 'agree')).not.toThrow();
	});
});
