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
const ListConverastions = vi.fn();

vi.mock('@crownshy/api-client/client', () => ({
	createApiClient: () => ({ GetConversation, ListConverastions })
}));

/** A live, public Conversation as the directory lists it. */
function listed(slug: string, place: { slug: string; name: string }) {
	return {
		id: `id-${slug}`,
		slug,
		title: slug,
		isLive: true,
		isPublic: true,
		isInviteOnly: false,
		isComplete: false,
		metadata: { place }
	};
}

/** An axios rejection as zodios surfaces it, which is what `httpStatusOf` reads. */
function httpError(status: number) {
	return Object.assign(new Error(`HTTP ${status}`), { response: { status } });
}

/** Run the layout load for `/<slug>`. */
async function loadSlug(slug: string) {
	const { load } = await import('./+layout.server');

	return (await load({
		params: { campaign: slug },
		url: new URL(`http://localhost:5173/${slug}`),
		depends: () => {}
		// The load reads only these three. The rest of the SvelteKit event is
		// irrelevant here and typing it out would only pin things this does not
		// test.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any)) as Exclude<Awaited<ReturnType<typeof load>>, void>;
}

/** Run the layout load for `/<slug>`, and return how it failed. */
async function loadFailure(slug: string) {
	try {
		await loadSlug(slug);
	} catch (e) {
		return e as { status: number; body: { message: string } };
	}

	throw new Error(`expected "${slug}" to fail the lookup`);
}

describe('campaign lookup failures', () => {
	beforeEach(() => {
		GetConversation.mockReset();
		ListConverastions.mockReset();
		ListConverastions.mockResolvedValue({ records: [] });
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

	it('503s when the Campaign is a 404 but the Place list cannot be read', async () => {
		// The slug might still be a Place, so "no such Campaign" would be a guess.
		GetConversation.mockRejectedValue(httpError(404));
		ListConverastions.mockRejectedValue(httpError(502));

		expect((await loadFailure('dundee')).status).toBe(503);
	});
});

describe('a slug that names a Place', () => {
	beforeEach(() => {
		GetConversation.mockReset();
		ListConverastions.mockReset();
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('lists the Place when no Campaign has the slug', async () => {
		const dundee = { slug: 'dundee', name: 'Dundee, Scotland' };
		GetConversation.mockRejectedValue(httpError(404));
		ListConverastions.mockResolvedValue({
			records: [listed('ai-dundee', dundee), listed('ai-utah', { slug: 'utah', name: 'Utah' })]
		});

		const data = await loadSlug('dundee');

		expect(data).toMatchObject({ kind: 'place', placeName: 'Dundee, Scotland' });
		expect(data.kind === 'place' && data.campaigns.map((c: { href: string }) => c.href)).toEqual([
			'/ai-dundee'
		]);
	});

	it('serves the Campaign when a Place shares its slug', async () => {
		// The Campaign's own card on that Place's page links to this address, so
		// listing the Place here would send it round in a circle.
		GetConversation.mockResolvedValue({ id: 'id-dundee', slug: 'dundee', title: 'Dundee' });

		const data = await loadSlug('dundee');

		expect(data.kind).toBe('campaign');
		expect(ListConverastions).not.toHaveBeenCalled();
	});
});
