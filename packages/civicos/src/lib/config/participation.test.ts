import { describe, expect, it } from 'vitest';
import {
	DEFAULT_ASK_TOGGLES,
	DEFAULT_TOGGLES,
	aboutYouQuestionsFor,
	ageBucketToNumber,
	askedVariants,
	resolveParticipation
} from './participation';
import { DEMOGRAPHIC_CATEGORIES } from '@civicos/shared/data/demographics';

describe('resolveParticipation', () => {
	it('asks for everything when there is no conversation', () => {
		for (const conversation of [null, undefined, {}, { metadata: 'nope' }]) {
			expect(resolveParticipation(conversation)).toEqual({
				demographics: DEFAULT_TOGGLES,
				asks: DEFAULT_ASK_TOGGLES
			});
		}
	});

	it('ignores non-boolean values rather than coercing them', () => {
		const participation = resolveParticipation({
			metadata: { demographics: { gender: 0 }, participantAsks: { share: 'false' } }
		});

		expect(participation.demographics).toEqual(DEFAULT_TOGGLES);
		expect(participation.asks).toEqual(DEFAULT_ASK_TOGGLES);
	});

	it('drops keys neither app knows about', () => {
		const participation = resolveParticipation({
			metadata: { demographics: { height: false }, participantAsks: { quiz: false } }
		});

		expect(participation.demographics).toEqual(DEFAULT_TOGGLES);
		expect(participation.asks).toEqual(DEFAULT_ASK_TOGGLES);
	});

	it('reads the Host switches out of metadata', () => {
		const participation = resolveParticipation({
			metadata: { demographics: { gender: false }, participantAsks: { share: false } }
		});

		expect(participation.demographics.gender).toBe(false);
		expect(participation.demographics.age).toBe(true);
		expect(participation.asks.share).toBe(false);
		expect(participation.asks.email).toBe(true);
	});
});

describe('aboutYouQuestionsFor', () => {
	it('builds one question per category the Host left on', () => {
		expect(aboutYouQuestionsFor(DEFAULT_TOGGLES).map((q) => q.key)).toEqual(
			DEMOGRAPHIC_CATEGORIES.map((c) => c.key)
		);
	});

	it('offers the options admin defines, not a parallel list', () => {
		const age = aboutYouQuestionsFor(DEFAULT_TOGGLES).find((q) => q.key === 'age');

		expect(age?.options).toEqual(DEMOGRAPHIC_CATEGORIES[0].options);
		expect(age?.title).toBe('Age');
		expect(age?.prompt).not.toBe('');
	});

	it('drops the categories the Host switched off', () => {
		const questions = aboutYouQuestionsFor({ ...DEFAULT_TOGGLES, gender: false });

		expect(questions.map((q) => q.key)).toEqual(['age', 'ethnicity', 'politicalParty']);
	});

	it('is empty when every category is off', () => {
		expect(
			aboutYouQuestionsFor({ age: false, ethnicity: false, gender: false, politicalParty: false })
		).toEqual([]);
	});
});

describe('ageBucketToNumber', () => {
	// The options and the numbers are one list now, but the profile upsert still
	// depends on every pickable label collapsing to a number (#426).
	it('has a number for every age option a participant can pick', () => {
		const age = DEMOGRAPHIC_CATEGORIES.find((c) => c.key === 'age');

		for (const option of age?.options ?? []) {
			expect(ageBucketToNumber(option), option).toBeTypeOf('number');
		}
	});

	it('has no number for a label from outside that list', () => {
		expect(ageBucketToNumber('65 - 84')).toBeUndefined();
		expect(ageBucketToNumber('')).toBeUndefined();
	});
});

describe('askedVariants', () => {
	it('keeps the checkpoint order when everything is on', () => {
		expect(askedVariants(DEFAULT_ASK_TOGGLES)).toEqual([
			'contribute',
			'email',
			'feedback',
			'share'
		]);
	});

	it('drops the asks the Host switched off, order intact', () => {
		expect(askedVariants({ ...DEFAULT_ASK_TOGGLES, email: false })).toEqual([
			'contribute',
			'feedback',
			'share'
		]);
	});

	it('is empty when every ask is off, which means no checkpoint pauses', () => {
		expect(
			askedVariants({ contribute: false, email: false, feedback: false, share: false })
		).toEqual([]);
	});
});
