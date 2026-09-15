import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * What the Campaign lookup answers when it does not find one.
 *
 * The three failures used to arrive through one bare `catch` and leave as one
 * 404, so a draft Campaign and an outage both told the Host their Campaign did
 * not exist. Only the 404 is really a wrong URL. These pin which is which,
 * because two of the branches cannot be reached by hand: a draft needs an
 * unlaunched Conversation and an outage needs comhairle stopped.
 */

const GetConversation = vi.fn();

vi.mock('@crownshy/api-client/client', () => ({
	createApiClient: () => ({ GetConversation })
}));

/** An axios rejection as zodios surfaces it, which is what `httpStatusOf` reads. */
function httpError(status: number) {
	return Object.assign(new Error(`HTTP ${status}`), { response: { status } });
}

/** Run the layout load for `/<org>/conversations/<slug>`, and return how it failed. */
async function loadFailure(slug: string) {
	const { load } = await import('./+layout.server');

	try {
		await load({
			params: { campaign: slug },
			url: new URL(`http://localhost:5173/dandan/conversations/${slug}`),
			depends: () => {}
			// The load reads only these three. The rest of the SvelteKit event is
			// irrelevant here and typing it out would only pin things this does not
			// test.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
	} catch (e) {
		return e as { status: number; body: { message: string } };
	}

	throw new Error(`expected "${slug}" to fail the lookup`);
}

describe('campaign lookup failures', () => {
	beforeEach(() => {
		GetConversation.mockReset();
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('404s a slug no Campaign has', async () => {
		GetConversation.mockRejectedValue(httpError(404));

		const failure = await loadFailure('never-existed');

		expect(failure.status).toBe(404);
		expect(failure.body.message).toContain('never-existed');
	});

	it('404s a draft exactly as it does an unclaimed slug', async () => {
		// Leaking "this one is taken" would let anyone enumerate Campaigns that
		// have not been announced. The Host learns it from admin instead.
		GetConversation.mockRejectedValue(httpError(403));

		const failure = await loadFailure('test-convo');

		expect(failure.status).toBe(404);
		expect(failure.body.message).toBe('There is no Campaign called "test-convo".');
		expect(console.warn).toHaveBeenCalledWith('[Campaign] "test-convo" exists but is not live yet');
	});

	it('503s when comhairle cannot answer', async () => {
		GetConversation.mockRejectedValue(httpError(502));

		const failure = await loadFailure('test-convo');

		expect(failure.status).toBe(503);
	});

	it('503s when the request never reaches comhairle', async () => {
		GetConversation.mockRejectedValue(new Error('ECONNREFUSED'));

		expect((await loadFailure('test-convo')).status).toBe(503);
	});
});
