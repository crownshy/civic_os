import { describe, it, expect } from 'vitest';
import { polisConfigFor } from './polis-step';

const polis = (pollId: string, extra: Record<string, unknown> = {}) => ({
	type: 'polis',
	poll_id: pollId,
	server_url: 'polis.comhairle.scot',
	...extra
});

describe('polisConfigFor', () => {
	it('reads a step that only has a preview config', () => {
		// The shape every Campaign created in admin has: `tool_setup` provisions the
		// poll and comhairle reports it under `previewToolConfig` alone.
		expect(polisConfigFor({ toolConfig: null, previewToolConfig: polis('872udjsx3u') })).toEqual({
			pollId: '872udjsx3u',
			serverUrl: 'https://polis.comhairle.scot',
			topic: null
		});
	});

	it('prefers toolConfig when the two disagree', () => {
		// Once a step has a `toolConfig`, its `previewToolConfig` holds a different,
		// unrelated poll. Preferring the preview would split admin moderation and
		// the participant embed across two Polis conversations.
		const step = { toolConfig: polis('6rnbindc56'), previewToolConfig: polis('9pdkph6vef') };

		expect(polisConfigFor(step)?.pollId).toBe('6rnbindc56');
	});

	it('makes the bare host comhairle reports into an absolute origin', () => {
		// civicos builds Polis request URLs by concatenation, so a scheme-less
		// server is read as a relative path and the embed 404s against the
		// participant app's own origin.
		expect(polisConfigFor({ previewToolConfig: polis('872udjsx3u') })?.serverUrl).toBe(
			'https://polis.comhairle.scot'
		);
	});

	it('leaves an already absolute server alone, trailing slash aside', () => {
		const step = { previewToolConfig: polis('x', { server_url: 'http://localhost:5000/' }) };

		expect(polisConfigFor(step)?.serverUrl).toBe('http://localhost:5000');
	});

	it('carries the topic when the step names one', () => {
		const step = { previewToolConfig: polis('872udjsx3u', { topic: 'How should we grow?' }) };

		expect(polisConfigFor(step)?.topic).toBe('How should we grow?');
	});

	it('is null for a step running some other tool', () => {
		expect(polisConfigFor({ toolConfig: { type: 'learn', pages: [] } })).toBeNull();
	});

	it('is null rather than throwing on a malformed or absent config', () => {
		expect(polisConfigFor(null)).toBeNull();
		expect(polisConfigFor({})).toBeNull();
		expect(polisConfigFor({ toolConfig: 'polis' })).toBeNull();
		// A Polis config with no poll id names no conversation, so it is no better
		// than an absent one.
		expect(polisConfigFor({ toolConfig: { type: 'polis', poll_id: '  ' } })).toBeNull();
	});

	it('falls through an unusable toolConfig to the preview', () => {
		const step = { toolConfig: { type: 'polis' }, previewToolConfig: polis('872udjsx3u') };

		expect(polisConfigFor(step)?.pollId).toBe('872udjsx3u');
	});
});
