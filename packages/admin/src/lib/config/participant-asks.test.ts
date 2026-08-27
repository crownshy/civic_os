import { describe, expect, it } from 'vitest';
import { DEFAULT_ASK_TOGGLES, readAskToggles } from './participant-asks';

describe('readAskToggles', () => {
	it('defaults every key on when metadata is missing or malformed', () => {
		for (const metadata of [null, undefined, 'nope', {}, { participantAsks: 'nope' }]) {
			expect(readAskToggles(metadata)).toEqual(DEFAULT_ASK_TOGGLES);
		}
	});

	it('reads stored booleans and falls back per key', () => {
		expect(readAskToggles({ participantAsks: { email: false } })).toEqual({
			contribute: true,
			email: false,
			feedback: true,
			share: true
		});
	});

	it('ignores non-boolean values rather than coercing them', () => {
		expect(readAskToggles({ participantAsks: { share: 0, feedback: 'false' } })).toEqual(
			DEFAULT_ASK_TOGGLES
		);
	});

	it('drops keys civicos does not know about', () => {
		expect(readAskToggles({ participantAsks: { quiz: true } })).toEqual(DEFAULT_ASK_TOGGLES);
	});
});
