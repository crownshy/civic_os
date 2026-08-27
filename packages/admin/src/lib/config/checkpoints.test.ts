import { describe, expect, it } from 'vitest';
import { DEFAULT_CHECKPOINT_TOGGLES, readCheckpointToggles } from './checkpoints';

describe('readCheckpointToggles', () => {
	it('defaults every key on when metadata is missing or malformed', () => {
		for (const metadata of [null, undefined, 'nope', {}, { checkpoints: 'nope' }]) {
			expect(readCheckpointToggles(metadata)).toEqual(DEFAULT_CHECKPOINT_TOGGLES);
		}
	});

	it('reads stored booleans and falls back per key', () => {
		expect(readCheckpointToggles({ checkpoints: { email: false } })).toEqual({
			contribute: true,
			email: false,
			feedback: true,
			share: true
		});
	});

	it('ignores non-boolean values rather than coercing them', () => {
		expect(readCheckpointToggles({ checkpoints: { share: 0, feedback: 'false' } })).toEqual(
			DEFAULT_CHECKPOINT_TOGGLES
		);
	});

	it('drops keys civicos does not know about', () => {
		expect(readCheckpointToggles({ checkpoints: { quiz: true } })).toEqual(
			DEFAULT_CHECKPOINT_TOGGLES
		);
	});
});
