import { describe, expect, it } from 'vitest';
import { GET } from './+server';

/** Where an old `/<org>/conversations/<slug>/...` link is sent. */
function redirectFor(path: string): { status: number; location: string } {
	const url = new URL(path, 'http://localhost');
	const [, org, , campaign, ...rest] = url.pathname.split('/');
	const event = { params: { org, campaign, rest: rest.join('/') }, url };

	try {
		// The handler reads only these two. Typing out the rest of the event would
		// pin things this does not test.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		GET(event as any);
	} catch (e) {
		return e as { status: number; location: string };
	}
	throw new Error(`expected ${path} to redirect`);
}

describe('old participant URLs', () => {
	it('sends the Campaign page to the root, permanently', () => {
		expect(redirectFor('/bloom/conversations/ai-utah')).toEqual({
			status: 308,
			location: '/ai-utah'
		});
	});

	it('renames contribute to poll', () => {
		expect(redirectFor('/bloom/conversations/ai-utah/contribute').location).toBe('/ai-utah/poll');
	});

	it('keeps the pages that kept their name, and the query string', () => {
		expect(redirectFor('/host/conversations/ai/events/42?utm_source=email').location).toBe(
			'/ai/events/42?utm_source=email'
		);
	});
});
