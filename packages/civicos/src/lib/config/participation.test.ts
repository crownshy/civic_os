import { describe, expect, it } from 'vitest';
import { DEFAULT_ASK_TOGGLES, askedVariants, resolveParticipation } from './participation';

describe('resolveParticipation', () => {
	it('uses defaults for absent or invalid switches', () => {
		for (const conversation of [null, undefined, {}, { metadata: 'nope' }]) {
			expect(resolveParticipation(conversation).asks).toEqual(DEFAULT_ASK_TOGGLES);
		}
		expect(
			resolveParticipation({ metadata: { participantAsks: { share: 'false' } } }).asks
		).toEqual(DEFAULT_ASK_TOGGLES);
	});

	it('reads the Host switches without reading demographic metadata', () => {
		const participation = resolveParticipation({
			metadata: { demographics: { gender: false }, participantAsks: { share: false } }
		});
		expect(participation).toEqual({ asks: { ...DEFAULT_ASK_TOGGLES, share: false } });
	});
});

describe('askedVariants', () => {
	it('keeps checkpoint order while dropping disabled asks', () => {
		expect(askedVariants({ ...DEFAULT_ASK_TOGGLES, email: false })).toEqual([
			'contribute',
			'feedback',
			'share'
		]);
	});

	it('returns no checkpoints when all asks are off', () => {
		expect(
			askedVariants({ contribute: false, email: false, feedback: false, share: false })
		).toEqual([]);
	});
});
